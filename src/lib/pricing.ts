/**
 * Canada Carpooling — Hybrid Pricing Model
 *
 * Trip price: Paid DIRECTLY from passenger to driver (cash, Interac e-Transfer, etc.)
 * Platform fee: $1 CAD + applicable taxes, charged via Stripe to BOTH parties:
 *   - Passenger: $1 + taxes at booking time (Stripe PaymentIntent)
 *   - Driver: $1 + taxes auto-deducted after trip completion (Stripe charge on Connect account)
 *
 * Tax rates by province (2026):
 *   - AB, NT, NU, YT: 5% GST only
 *   - BC: 5% GST + 7% PST = 12%
 *   - MB: 5% GST + 7% RST = 12%
 *   - SK: 5% GST + 6% PST = 11%
 *   - QC: 5% GST + 9.975% QST = 14.975%
 *   - ON: 13% HST
 *   - NB, NL, NS, PE: 15% HST
 */

// ─── Constants ───

export const PLATFORM_FEE_BASE = 1.00; // $1 CAD

// Province tax configuration
export const PROVINCE_TAX: Record<string, { rate: number; name: string; type: 'HST' | 'GST' | 'GST+PST' | 'GST+QST' | 'GST+RST' }> = {
  AB: { rate: 0.05, name: 'GST', type: 'GST' },
  BC: { rate: 0.12, name: 'GST+PST', type: 'GST+PST' },
  MB: { rate: 0.12, name: 'GST+RST', type: 'GST+RST' },
  NB: { rate: 0.15, name: 'HST', type: 'HST' },
  NL: { rate: 0.15, name: 'HST', type: 'HST' },
  NS: { rate: 0.15, name: 'HST', type: 'HST' },
  NT: { rate: 0.05, name: 'GST', type: 'GST' },
  NU: { rate: 0.05, name: 'GST', type: 'GST' },
  ON: { rate: 0.13, name: 'HST', type: 'HST' },
  PE: { rate: 0.15, name: 'HST', type: 'HST' },
  QC: { rate: 0.14975, name: 'GST+TVQ', type: 'GST+QST' },
  SK: { rate: 0.11, name: 'GST+PST', type: 'GST+PST' },
  YT: { rate: 0.05, name: 'GST', type: 'GST' },
};

// Default to GST only if province unknown
const DEFAULT_TAX_RATE = 0.05;
const DEFAULT_TAX_NAME = 'GST';

// ─── Platform Fee Calculation ───

export interface PlatformFeeBreakdown {
  baseFee: number;        // $1.00
  taxRate: number;        // e.g. 0.13 for Ontario
  taxName: string;        // e.g. "HST"
  taxAmount: number;      // e.g. $0.13
  totalFee: number;       // e.g. $1.13
  totalFeeCents: number;  // e.g. 113 (for Stripe)
}

/**
 * Calculate the platform fee ($1 + taxes) for a given province.
 * Used for both passenger (at booking) and driver (after trip).
 */
export function calculatePlatformFee(provinceCode?: string): PlatformFeeBreakdown {
  const province = provinceCode?.toUpperCase();
  const taxConfig = province && PROVINCE_TAX[province]
    ? PROVINCE_TAX[province]
    : { rate: DEFAULT_TAX_RATE, name: DEFAULT_TAX_NAME };

  const taxAmount = roundCents(PLATFORM_FEE_BASE * taxConfig.rate);
  const totalFee = roundCents(PLATFORM_FEE_BASE + taxAmount);

  return {
    baseFee: PLATFORM_FEE_BASE,
    taxRate: taxConfig.rate,
    taxName: taxConfig.name,
    taxAmount,
    totalFee,
    totalFeeCents: Math.round(totalFee * 100),
  };
}

// ─── Booking Price Calculation ───

export interface BookingPriceBreakdown {
  tripPrice: number;          // Price × seats — paid directly to driver
  seats: number;
  pricePerSeat: number;
  platformFee: PlatformFeeBreakdown;  // $1 + taxes — paid via Stripe
  totalPassengerPays: number;         // tripPrice (direct) + platformFee (Stripe)
  driverReceives: number;             // tripPrice (direct from passenger)
}

/**
 * Calculate the full price breakdown for a passenger booking.
 * Trip price = direct payment to driver.
 * Platform fee = $1 + taxes via Stripe.
 */
export function calculateBookingPrice(
  pricePerSeat: number,
  seats: number,
  provinceCode?: string
): BookingPriceBreakdown {
  const tripPrice = roundCents(pricePerSeat * seats);
  const platformFee = calculatePlatformFee(provinceCode);

  return {
    tripPrice,
    seats,
    pricePerSeat,
    platformFee,
    totalPassengerPays: roundCents(tripPrice + platformFee.totalFee),
    driverReceives: tripPrice,
  };
}

// ─── Helpers ───

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Format price in CAD
 */
export function formatCAD(amount: number): string {
  return `${amount.toFixed(2)} $`;
}
