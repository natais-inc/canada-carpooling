/**
 * Stripe integration — Platform Fee Collection Only
 *
 * Stripe is used EXCLUSIVELY for collecting the $1 + taxes platform fee:
 *   - Passengers: PaymentIntent at booking time
 *   - Drivers: Charge via Stripe Connect after trip completion
 *
 * Trip prices are paid directly passenger → driver (cash, Interac, etc.)
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set — Stripe features disabled');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any })
  : null;

// ─── Customer Management (Passengers) ───

/**
 * Get or create a Stripe Customer for a passenger (used for $1 fee collection).
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string | null> {
  if (!stripe) return null;

  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer deleted or invalid — create new
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId, platform: 'canada-carpooling' },
  });

  return customer.id;
}

// ─── Passenger Fee: PaymentIntent ($1 + taxes at booking) ───

/**
 * Create a PaymentIntent for the passenger's $1 + taxes platform fee.
 * Called at booking time.
 */
export async function createPlatformFeePaymentIntent(
  amountCents: number,
  customerId: string,
  metadata: {
    bookingId: string;
    tripId: string;
    passengerId: string;
    feeType: 'passenger_platform_fee';
    provinceCode?: string;
  }
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) return null;

  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'cad',
    customer: customerId,
    metadata: {
      ...metadata,
      platform: 'canada-carpooling',
    },
    description: 'Canada Carpooling — Frais de service passager / Passenger service fee',
    automatic_payment_methods: { enabled: true },
  });
}

/**
 * Confirm a PaymentIntent (server-side confirmation for saved payment methods).
 */
export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) return null;
  return stripe.paymentIntents.confirm(paymentIntentId);
}

// ─── Driver Fee: Stripe Connect ($1 + taxes after trip) ───

/**
 * Create a Stripe Connect Express account for a driver.
 * Used to collect the $1 platform fee after each trip.
 */
export async function createConnectAccount(
  email: string,
  userId: string
): Promise<Stripe.Account | null> {
  if (!stripe) return null;

  return stripe.accounts.create({
    type: 'express',
    country: 'CA',
    email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    metadata: {
      userId,
      platform: 'canada-carpooling',
      purpose: 'driver_fee_collection',
    },
    business_type: 'individual',
    business_profile: {
      mcc: '4121', // Taxicabs and Limousines
      product_description: 'Carpooling platform fee collection',
    },
  });
}

/**
 * Create an Account Link for Stripe Connect onboarding.
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink | null> {
  if (!stripe) return null;

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

/**
 * Create a login link for a driver to access their Stripe Express dashboard.
 */
export async function createLoginLink(
  accountId: string
): Promise<Stripe.LoginLink | null> {
  if (!stripe) return null;
  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Check the status of a Stripe Connect account.
 */
export async function getAccountStatus(
  accountId: string
): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean } | null> {
  if (!stripe) return null;

  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/**
 * Charge a driver the $1 + taxes platform fee after trip completion.
 * Creates a charge on the driver's Connect account (direct charge model).
 */
export async function chargeDriverPlatformFee(
  amountCents: number,
  driverStripeAccountId: string,
  metadata: {
    tripId: string;
    driverId: string;
    feeType: 'driver_platform_fee';
    provinceCode?: string;
  }
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) return null;

  // Use destination charge: we charge the driver's payment method
  // via the platform, keeping 100% as platform fee
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'cad',
    metadata: {
      ...metadata,
      platform: 'canada-carpooling',
    },
    description: 'Canada Carpooling — Frais de service conducteur / Driver service fee',
    // For driver fee collection, we use the Connect account's default payment method
    transfer_data: {
      destination: driverStripeAccountId,
    },
    // The platform keeps 100% of the fee
    application_fee_amount: amountCents,
  });
}

// ─── Refunds ───

/**
 * Refund a passenger's platform fee (e.g., free cancellation > 24h before departure).
 */
export async function refundPlatformFee(
  paymentIntentId: string,
  reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent'
): Promise<Stripe.Refund | null> {
  if (!stripe) return null;

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: reason || 'requested_by_customer',
  });
}

// ─── Webhook ───

/**
 * Construct and verify a Stripe webhook event.
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) return null;

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
