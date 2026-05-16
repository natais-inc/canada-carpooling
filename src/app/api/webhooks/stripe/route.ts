import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { constructWebhookEvent } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe — Handle Stripe webhook events.
 * Processes payment confirmations for platform fees ($1 + taxes).
 */
export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature, webhookSecret);
    if (!event) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const { bookingId, feeType, tripId, driverId } = paymentIntent.metadata || {};

        if (feeType === 'passenger_platform_fee' && bookingId) {
          // Passenger fee paid — update booking payment status
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'PAID' },
          });
          console.log(`Passenger fee paid for booking ${bookingId}`);
        }

        if (feeType === 'driver_platform_fee' && tripId) {
          // Driver fee collected — log it
          console.log(`Driver fee collected for trip ${tripId}, driver ${driverId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const { bookingId, feeType } = paymentIntent.metadata || {};

        if (feeType === 'passenger_platform_fee' && bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'FAILED' },
          });
          console.log(`Passenger fee failed for booking ${bookingId}`);
        }
        break;
      }

      case 'account.updated': {
        // Driver Stripe Connect account updated
        const account = event.data.object as any;
        if (account.metadata?.userId) {
          // Update driver's Stripe status if charges are now enabled
          console.log(`Stripe Connect account updated for user ${account.metadata.userId}: charges=${account.charges_enabled}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          const booking = await prisma.booking.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });
          if (booking) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: 'REFUNDED' },
            });
            console.log(`Refund processed for booking ${booking.id}`);
          }
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
