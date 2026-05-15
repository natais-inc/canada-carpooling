import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { constructWebhookEvent } from '@/lib/stripe';
import { headers } from 'next/headers';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ─── Payment Events ───
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
            },
          });

          // Notify driver
          await prisma.notification.create({
            data: {
              userId: (await prisma.trip.findUnique({
                where: { id: booking.tripId },
                select: { driverId: true },
              }))!.driverId,
              type: 'BOOKING',
              title: 'Nouvelle réservation confirmée',
              message: `Un passager a réservé ${booking.seatsBooked} place(s) pour votre trajet.`,
              data: JSON.stringify({ bookingId: booking.id, tripId: booking.tripId }),
            },
          });

          // Notify passenger
          await prisma.notification.create({
            data: {
              userId: booking.passengerId,
              type: 'BOOKING',
              title: 'Paiement confirmé',
              message: 'Votre paiement a été accepté. Votre réservation est confirmée!',
              data: JSON.stringify({ bookingId: booking.id, tripId: booking.tripId }),
            },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (booking) {
          // Restore seats
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { availableSeats: { increment: booking.seatsBooked } },
          });

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED',
            },
          });

          // Notify passenger
          await prisma.notification.create({
            data: {
              userId: booking.passengerId,
              type: 'SYSTEM',
              title: 'Paiement échoué',
              message: 'Votre paiement a échoué. Veuillez réessayer ou utiliser un autre moyen de paiement.',
              data: JSON.stringify({ bookingId: booking.id }),
            },
          });
        }
        break;
      }

      // ─── Refund Events ───
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;

        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (booking) {
          const isFullRefund = charge.amount_refunded === charge.amount;
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
          });

          // Notify passenger about refund
          await prisma.notification.create({
            data: {
              userId: booking.passengerId,
              type: 'SYSTEM',
              title: isFullRefund ? 'Remboursement complet' : 'Remboursement partiel',
              message: isFullRefund
                ? 'Vous avez été remboursé intégralement.'
                : 'Un remboursement partiel (50%) a été effectué suite à votre annulation.',
              data: JSON.stringify({ bookingId: booking.id }),
            },
          });
        }
        break;
      }

      // ─── Connect Account Events ───
      case 'account.updated': {
        const account = event.data.object;
        const user = await prisma.user.findFirst({
          where: { stripeAccountId: account.id },
        });

        if (user && account.charges_enabled && account.payouts_enabled) {
          // Mark user as payment-ready (could add a field for this)
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'SYSTEM',
              title: 'Compte paiement activé',
              message: 'Votre compte de paiement est maintenant actif. Vous pouvez recevoir des paiements pour vos trajets!',
              data: JSON.stringify({ stripeAccountId: account.id }),
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
