import Stripe from 'stripe';
import { type BookingPriceBreakdown, calculateStripeAmounts } from './pricing';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// ─── Stripe Connect: Driver Onboarding ───

export async function createConnectAccount(
  email: string,
  userId: string,
  firstName: string,
  lastName: string
) {
  return stripe.accounts.create({
    type: 'express',
    country: 'CA',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    individual: {
      first_name: firstName,
      last_name: lastName,
      email,
    },
    metadata: {
      userId,
      platform: 'canada-carpooling',
    },
  });
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export async function createLoginLink(accountId: string) {
  return stripe.accounts.createLoginLink(accountId);
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  };
}

// ─── Payments ───

/**
 * Create a PaymentIntent using the new flat-fee pricing model.
 * - Total charged = trip price + service fee (1 CAD/seat + taxes)
 * - application_fee_amount = service fee (platform keeps this)
 * - Driver receives: total - application_fee via Stripe Connect transfer
 */
export async function createPaymentIntent(
  priceBreakdown: BookingPriceBreakdown,
  driverStripeConnectId: string,
  metadata: Record<string, string>
) {
  const { totalAmountCents, applicationFeeCents } = calculateStripeAmounts(priceBreakdown);

  return stripe.paymentIntents.create({
    amount: totalAmountCents,
    currency: 'cad',
    application_fee_amount: applicationFeeCents,
    transfer_data: {
      destination: driverStripeConnectId,
    },
    metadata: {
      ...metadata,
      serviceFeeBase: String(priceBreakdown.serviceFeeBase),
      serviceFeeTax: String(priceBreakdown.serviceFeeTax),
      provinceCode: priceBreakdown.provinceCode,
      taxName: priceBreakdown.taxBreakdown.taxName,
    },
  });
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// ─── Refunds ───

export async function refundPayment(paymentIntentId: string, amount?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined, // full refund if no amount
  });
}

// Cancellation refund logic:
// >24h before departure: full refund
// <24h before departure: 50% refund
// no-show: no refund
export async function processCancellationRefund(
  paymentIntentId: string,
  totalAmountCents: number,
  departureTime: Date
) {
  const hoursUntilDeparture = (departureTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilDeparture > 24) {
    // Full refund
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  } else if (hoursUntilDeparture > 0) {
    // 50% refund
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(totalAmountCents / 2),
    });
  }

  // No-show or past departure: no refund
  return null;
}

// ─── Webhook Verification ───

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  endpointSecret: string
) {
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
}
