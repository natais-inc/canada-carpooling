import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { refundPlatformFee } from '@/lib/stripe';

// POST /api/bookings/[id]/cancel — Cancel a booking (hybrid model)
// Refund $1+taxes platform fee via Stripe if free cancellation (>24h before departure)
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

    // Cancellation policy — refund $1+taxes platform fee if > 24h before departure
    const hoursUntilDeparture = (booking.trip.departureDate.getTime() - Date.now()) / (1000 * 60 * 60);
    let cancellationType: 'FREE' | 'LATE' | 'VERY_LATE';
    if (hoursUntilDeparture > 24) {
      cancellationType = 'FREE';
    } else if (hoursUntilDeparture > 0) {
      cancellationType = 'LATE';
    } else {
      cancellationType = 'VERY_LATE';
    }

    // Refund the $1+taxes Stripe platform fee for free cancellations
    let refunded = false;
    if (cancellationType === 'FREE' && booking.stripePaymentIntentId && booking.paymentStatus === 'PAID') {
      const refund = await refundPlatformFee(booking.stripePaymentIntentId, 'requested_by_customer');
      if (refund) {
        refunded = true;
        // Webhook will update paymentStatus to REFUNDED, but set it here too for immediate response
        await prisma.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
    }

    // Also refund if driver cancels (regardless of timing — not the passenger's fault)
    if (isDriver && booking.stripePaymentIntentId && booking.paymentStatus === 'PAID') {
      const refund = await refundPlatformFee(booking.stripePaymentIntentId, 'requested_by_customer');
      if (refund) {
        refunded = true;
        await prisma.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: isPassenger ? 'CANCELLED_BY_PASSENGER' : 'CANCELLED_BY_DRIVER',
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
          cancellationType,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      cancellationType,
      refunded,
      message: cancellationType === 'FREE'
        ? 'Réservation annulée (annulation gratuite, +24h avant départ). Frais de service remboursé.'
        : cancellationType === 'LATE'
        ? 'Réservation annulée (moins de 24h avant départ — annulation tardive notée). Frais de service non remboursable.'
        : 'Réservation annulée (après départ — annulation très tardive notée). Frais de service non remboursable.',
    });
  } catch (error: unknown) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
