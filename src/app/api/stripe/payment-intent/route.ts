import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateCustomer, createPlatformFeePaymentIntent } from '@/lib/stripe';
import { calculatePlatformFee } from '@/lib/pricing';

/**
 * POST /api/stripe/payment-intent — Create a PaymentIntent for the passenger's 1.99$ TTC platform fee.
 * Called during the booking flow before confirmation.
 * Amount is always 199 cents CAD (taxes included).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, tripId, provinceCode } = body;

    if (!bookingId || !tripId) {
      return NextResponse.json({ error: 'bookingId and tripId required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email,
      `${user.firstName} ${user.lastName}`,
      user.stripeCustomerId
    );

    if (!customerId) {
      return NextResponse.json({ error: 'Stripe unavailable' }, { status: 503 });
    }

    // Save customer ID if new
    if (customerId !== user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Calculate platform fee
    const fee = calculatePlatformFee(provinceCode);

    // Create PaymentIntent
    const paymentIntent = await createPlatformFeePaymentIntent(
      fee.totalFeeCents,
      customerId,
      {
        bookingId,
        tripId,
        passengerId: user.id,
        feeType: 'passenger_platform_fee',
        provinceCode: provinceCode || 'default',
      }
    );

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Could not create payment' }, { status: 503 });
    }

    // Store payment intent on booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        serviceFee: fee.baseFee,
        serviceFeeTax: fee.taxAmount,
        serviceFeeTotal: fee.totalFee,
        provinceCode: provinceCode || null,
        taxName: fee.taxName,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      fee: {
        base: fee.baseFee,
        tax: fee.taxAmount,
        taxName: fee.taxName,
        total: fee.totalFee,
      },
    });
  } catch (error: unknown) {
    console.error('Create payment intent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
