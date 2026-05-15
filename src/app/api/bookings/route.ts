import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateBookingPrice, extractProvinceCode } from '@/lib/pricing';
import { createPaymentIntent } from '@/lib/stripe';
import { requireValidConsent } from '@/lib/consent-middleware';
import { z } from 'zod';

const bookingSchema = z.object({
  tripId: z.string(),
  seats: z.number().min(1).max(8),
  pickupStopId: z.string().optional(),
  dropoffStopId: z.string().optional(),
});

// POST /api/bookings — Create booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PIPEDA consent check
    const consentCheck = await requireValidConsent(session.user.id);
    if (consentCheck) return consentCheck;

    const body = await req.json();
    const { tripId, seats, pickupStopId, dropoffStopId } = bookingSchema.parse(body);

    // === Use a Prisma interactive transaction to prevent race conditions ===
    // Without this, two concurrent requests could both pass the seat check
    // and create bookings, resulting in overbooking.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get trip with driver info (read inside transaction for consistency)
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: { driver: true },
      });

      if (!trip) throw { code: 'NOT_FOUND', message: 'Trip not found' };
      if (trip.status !== 'ACTIVE') throw { code: 'BAD_REQUEST', message: 'Trip not available' };
      if (trip.availableSeats < seats) throw { code: 'BAD_REQUEST', message: 'Not enough seats' };
      if (trip.driverId === session.user.id) throw { code: 'BAD_REQUEST', message: 'Cannot book own trip' };

      // 2. Check existing booking (inside transaction)
      const existing = await tx.booking.findFirst({
        where: { tripId, passengerId: session.user.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      });
      if (existing) throw { code: 'BAD_REQUEST', message: 'Already booked' };

      // 3. Atomically decrement seats with a conditional guard
      //    updateMany with a WHERE on availableSeats ensures no overbooking
      const updated = await tx.trip.updateMany({
        where: { id: tripId, availableSeats: { gte: seats } },
        data: { availableSeats: { decrement: seats } },
      });
      if (updated.count === 0) {
        throw { code: 'BAD_REQUEST', message: 'Not enough seats (concurrent booking)' };
      }

      // 4. Calculate pricing
      const provinceCode = extractProvinceCode(trip.originCity);
      const priceBreakdown = calculateBookingPrice(trip.pricePerSeat, seats, provinceCode);

      // 5. Create Stripe PaymentIntent if driver has Stripe Connect
      //    Done inside the transaction so we can roll back on failure
      let stripePaymentIntentId: string | undefined;
      if (trip.driver.stripeAccountId) {
        try {
          const paymentIntent = await createPaymentIntent(
            priceBreakdown,
            trip.driver.stripeAccountId,
            { tripId, passengerId: session.user.id, seats: String(seats) }
          );
          stripePaymentIntentId = paymentIntent.id;
        } catch (stripeError) {
          // Transaction will roll back the seat decrement automatically
          console.error('Stripe PaymentIntent creation failed:', stripeError);
          throw { code: 'PAYMENT_ERROR', message: 'Payment setup failed. Please try again.' };
        }
      }

      // 6. Create booking record
      const booking = await tx.booking.create({
        data: {
          tripId,
          passengerId: session.user.id,
          seatsBooked: seats,
          totalPrice: priceBreakdown.tripPrice,
          serviceFee: priceBreakdown.serviceFeeBase,
          serviceFeeTax: priceBreakdown.serviceFeeTax,
          serviceFeeTotal: priceBreakdown.serviceFeeTotal,
          driverPayout: priceBreakdown.driverPayout,
          provinceCode,
          taxName: priceBreakdown.taxBreakdown.taxName,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          stripePaymentIntentId,
          pickupLocation: pickupStopId,
          dropoffLocation: dropoffStopId,
        },
      });

      return { booking, priceBreakdown, stripePaymentIntentId };
    }, {
      // Serializable isolation prevents phantom reads (strongest guarantee)
      isolationLevel: 'Serializable',
      timeout: 15000, // 15s timeout for the whole transaction
    });

    return NextResponse.json({
      booking: result.booking,
      priceBreakdown: result.priceBreakdown,
      clientSecret: result.stripePaymentIntentId ? `${result.stripePaymentIntentId}_secret` : null,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    // Handle structured errors from the transaction
    const txError = error as any;
    if (txError?.code === 'NOT_FOUND') {
      return NextResponse.json({ error: txError.message }, { status: 404 });
    }
    if (txError?.code === 'BAD_REQUEST') {
      return NextResponse.json({ error: txError.message }, { status: 400 });
    }
    if (txError?.code === 'PAYMENT_ERROR') {
      return NextResponse.json({ error: txError.message }, { status: 502 });
    }
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bookings — List user's bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { passengerId: session.user.id },
      include: {
        trip: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                averageRating: true,
                verificationStatus: true,
              },
            },
            stops: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error: unknown) {
    console.error('List bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
