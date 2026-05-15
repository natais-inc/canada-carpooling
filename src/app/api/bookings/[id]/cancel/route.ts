import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processCancellationRefund } from '@/lib/stripe';

// POST /api/bookings/[id]/cancel — Cancel a booking with refund policy
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        trip: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only the passenger or the driver can cancel
    const isPassenger = booking.passengerId === session.user.id;
    const isDriver = booking.trip.driverId === session.user.id;

    if (!isPassenger && !isDriver) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (['CANCELLED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot cancel completed booking' }, { status: 400 });
    }

    // Process refund if payment was made
    let refundResult = null;
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'PAID') {
      const totalAmountCents = Math.round((booking.totalPrice + booking.serviceFee) * 100);

      if (isDriver) {
        // Driver cancels → full refund to passenger always
        refundResult = await processCancellationRefund(
          booking.stripePaymentIntentId,
          totalAmountCents,
          new Date(Date.now() + 48 * 60 * 60 * 1000) // force >24h logic → full refund
        );
      } else {
        // Passenger cancels → apply cancellation policy based on departure time
        refundResult = await processCancellationRefund(
          booking.stripePaymentIntentId,
          totalAmountCents,
          booking.trip.departureDate
        );
      }
    }

    // Update booking status
    const hoursUntilDeparture = (booking.trip.departureDate.getTime() - Date.now()) / (1000 * 60 * 60);
    let refundType: string;
    if (isDriver || hoursUntilDeparture > 24) {
      refundType = 'FULL';
    } else if (hoursUntilDeparture > 0) {
      refundType = 'PARTIAL';
    } else {
      refundType = 'NONE';
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: isPassenger ? 'CANCELLED_BY_PASSENGER' : 'CANCELLED_BY_DRIVER',
        paymentStatus: refundResult ? (refundType === 'FULL' ? 'REFUNDED' : 'PARTIALLY_REFUNDED') : booking.paymentStatus,
        cancelledAt: new Date(),
      },
    });

    // Restore available seats
    await prisma.trip.update({
      where: { id: booking.tripId },
      data: { availableSeats: { increment: booking.seatsBooked } },
    });

    // Update cancellation rate for the person who cancelled
    const cancellerId = isPassenger ? booking.passengerId : booking.trip.driverId;
    const totalBookings = await prisma.booking.count({
      where: isPassenger
        ? { passengerId: cancellerId }
        : { trip: { driverId: cancellerId } },
    });
    const cancelledBookings = await prisma.booking.count({
      where: isPassenger
        ? { passengerId: cancellerId, status: { in: ['CANCELLED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'] } }
        : { trip: { driverId: cancellerId }, status: { in: ['CANCELLED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'] } },
    });

    await prisma.user.update({
      where: { id: cancellerId },
      data: { cancellationRate: totalBookings > 0 ? cancelledBookings / totalBookings : 0 },
    });

    // Notify the other party
    const notifyUserId = isPassenger ? booking.trip.driverId : booking.passengerId;
    const cancellerName = isPassenger ? 'Un passager' : `${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'BOOKING',
        title: 'Réservation annulée',
        message: `${cancellerName} a annulé la réservation pour le trajet du ${booking.trip.departureDate.toLocaleDateString('fr-CA')}.`,
        data: JSON.stringify({
          bookingId: booking.id,
          tripId: booking.tripId,
          refundType,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      refundType,
      message: refundType === 'FULL'
        ? 'Remboursement complet effectué'
        : refundType === 'PARTIAL'
        ? 'Remboursement partiel (50%) effectué'
        : 'Aucun remboursement — annulation tardive',
    });
  } catch (error: unknown) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
