import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chargeDriverPlatformFee } from '@/lib/stripe';
import { calculatePlatformFee } from '@/lib/pricing';

/**
 * POST /api/trips/[id]/complete — Mark a trip as completed and charge the driver $1 + taxes.
 * Only the driver can complete their own trip.
 * This triggers the platform fee collection from the driver's Stripe Connect account.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        driver: {
          select: {
            id: true,
            stripeAccountId: true,
          },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { id: true, seatsBooked: true, passengerId: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Only the driver can complete the trip
    if (trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Only the driver can complete this trip' }, { status: 403 });
    }

    // Trip must be active
    if (trip.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Trip is not active' }, { status: 400 });
    }

    // Trip must be past departure time
    if (trip.departureDate.getTime() > Date.now()) {
      return NextResponse.json({ error: 'Trip has not departed yet' }, { status: 400 });
    }

    // Must have at least one confirmed booking
    if (trip.bookings.length === 0) {
      // No bookings — just mark as completed, no fee
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED' },
      });

      return NextResponse.json({
        success: true,
        driverFeeCharged: false,
        message: 'Trajet complété (aucun passager confirmé — pas de frais)',
      });
    }

    // Mark trip as completed
    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'COMPLETED' },
    });

    // Mark all confirmed bookings as completed
    await prisma.booking.updateMany({
      where: { tripId: trip.id, status: 'CONFIRMED' },
      data: { status: 'COMPLETED' },
    });

    // Charge driver $1 + taxes platform fee via Stripe Connect
    let driverFeeCharged = false;
    let driverFeeError: string | null = null;

    if (trip.driver.stripeAccountId) {
      // Use province from the first confirmed booking if available, otherwise default GST
      const firstBookingProvince = await prisma.booking.findFirst({
        where: { tripId: trip.id, status: 'COMPLETED', provinceCode: { not: null } },
        select: { provinceCode: true },
      });
      const provinceCode = firstBookingProvince?.provinceCode || undefined;
      const fee = calculatePlatformFee(provinceCode);

      const paymentIntent = await chargeDriverPlatformFee(
        fee.totalFeeCents,
        trip.driver.stripeAccountId,
        {
          tripId: trip.id,
          driverId: trip.driverId,
          feeType: 'driver_platform_fee',
          provinceCode,
        }
      );

      if (paymentIntent) {
        driverFeeCharged = true;
      } else {
        driverFeeError = 'Stripe unavailable — driver fee will be retried';
      }
    } else {
      driverFeeError = 'Driver has no Stripe Connect account — fee collection skipped';
    }

    // Update driver stats (trips completed)
    await prisma.user.update({
      where: { id: trip.driverId },
      data: { totalTripsAsDriver: { increment: 1 } },
    });

    // Notify passengers that the trip is completed
    for (const booking of trip.bookings) {
      await prisma.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'Trajet complété',
          message: `Votre trajet du ${trip.departureDate.toLocaleDateString('fr-CA')} est terminé. N'oubliez pas d'évaluer votre conducteur!`,
          data: JSON.stringify({
            tripId: trip.id,
            bookingId: booking.id,
            action: 'rate_driver',
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      driverFeeCharged,
      driverFeeError,
      completedBookings: trip.bookings.length,
      message: driverFeeCharged
        ? 'Trajet complété — frais de service conducteur prélevé'
        : 'Trajet complété',
    });
  } catch (error: unknown) {
    console.error('Trip completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
