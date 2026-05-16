/**
 * Canada Carpooling — Hybrid Pricing Model
 *
 * Trip price: Paid DIRECTLY from passenger to driver (cash, Interac e-Transfer, etc.)
 * Platform fee: 1,99$ CAD TTC (taxes incluses) — charged to passenger only via Stripe.
 *   - Total always = 1.99$ (199 cents)
 *   - Pre-tax base = 1.99 / (1 + taxRate), back-calculated per province
 *   - Tax portion = 1.99 - preTaxBase
 *   - NO driver fee — drivers pay nothing.
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

export const PLATFORM_FEE_TTC = 1.99; // $1.99 CAD taxes included
export const PLATFORM_FEE_TTC_CENTS = 199; // Always 199 cents charged to Stripe

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
  baseFee: number;        // Pre-tax amount (back-calculated from 1.99$)
  taxRate: number;        // e.g. 0.13 for Ontario
  taxName: string;        // e.g. "HST"
  taxAmount: number;      // Tax portion within the 1.99$
  totalFee: number;       // Always 1.99$
  totalFeeCents: number;  // Always 199 (for Stripe)
}

/**
 * Calculate the platform fee breakdown for a given province.
 * Total is ALWAYS 1.99$ TTC — taxes are INCLUDED, not added on top.
 * Pre-tax base and tax amount are back-calculated for accounting purposes.
 */
export function calculatePlatformFee(provinceCode?: string): PlatformFeeBreakdown {
  const province = provinceCode?.toUpperCase();
  const taxConfig = province && PROVINCE_TAX[province]
    ? PROVINCE_TAX[province]
    : { rate: DEFAULT_TAX_RATE, name: DEFAULT_TAX_NAME };

  // Back-calculate: totalTTC = base * (1 + rate) → base = totalTTC / (1 + rate)
  const baseFee = roundCents(PLATFORM_FEE_TTC / (1 + taxConfig.rate));
  const taxAmount = roundCents(PLATFORM_FEE_TTC - baseFee);

  return {
    baseFee,
    taxRate: taxConfig.rate,
    taxName: taxConfig.name,
    taxAmount,
    totalFee: PLATFORM_FEE_TTC,
    totalFeeCents: PLATFORM_FEE_TTC_CENTS,
  };
}

// ─── Booking Price Calculation ───

export interface BookingPriceBreakdown {
  tripPrice: number;          // Price × seats — paid directly to driver
  seats: number;
  pricePerSeat: number;
  platformFee: PlatformFeeBreakdown;  // 1.99$ TTC — paid via Stripe
  totalPassengerPays: number;         // tripPrice (direct) + 1.99$ (Stripe)
  driverReceives: number;             // tripPrice (direct from passenger)
}

/**
 * Calculate the full price breakdown for a passenger booking.
 * Trip price = direct payment to driver.
 * Platform fee = 1.99$ TTC via Stripe (passenger only, no driver fee).
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
