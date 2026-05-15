/**
 * Canada Carpooling — Pricing Model
 * 
 * Model: 1 CAD flat service fee + applicable taxes per passenger per trip
 * - Drivers: FREE registration, receive 100% of trip price
 * - Passengers: pay trip price + 1.00 CAD service fee + taxes on service fee
 * - Platform revenue: 1.00 CAD + taxes (remitted to CRA) per passenger per trip
 */

// ─── Canadian Tax Rates by Province ───

export interface TaxBreakdown {
  gst: number;      // Federal GST (5%)
  pst: number;      // Provincial sales tax
  hst: number;      // Harmonized sales tax (replaces GST+PST in some provinces)
  qst: number;      // Quebec sales tax
  totalRate: number; // Total tax rate
  taxName: string;   // Display name
}

const TAX_RATES: Record<string, TaxBreakdown> = {
  AB: { gst: 0.05, pst: 0, hst: 0, qst: 0, totalRate: 0.05, taxName: 'GST' },
  BC: { gst: 0.05, pst: 0.07, hst: 0, qst: 0, totalRate: 0.12, taxName: 'GST + PST' },
  MB: { gst: 0.05, pst: 0.07, hst: 0, qst: 0, totalRate: 0.12, taxName: 'GST + PST' },
  NB: { gst: 0, pst: 0, hst: 0.15, qst: 0, totalRate: 0.15, taxName: 'HST' },
  NL: { gst: 0, pst: 0, hst: 0.15, qst: 0, totalRate: 0.15, taxName: 'HST' },
  NS: { gst: 0, pst: 0, hst: 0.15, qst: 0, totalRate: 0.15, taxName: 'HST' },
  NT: { gst: 0.05, pst: 0, hst: 0, qst: 0, totalRate: 0.05, taxName: 'GST' },
  NU: { gst: 0.05, pst: 0, hst: 0, qst: 0, totalRate: 0.05, taxName: 'GST' },
  ON: { gst: 0, pst: 0, hst: 0.13, qst: 0, totalRate: 0.13, taxName: 'HST' },
  PE: { gst: 0, pst: 0, hst: 0.15, qst: 0, totalRate: 0.15, taxName: 'HST' },
  QC: { gst: 0.05, pst: 0, hst: 0, qst: 0.09975, totalRate: 0.14975, taxName: 'TPS + TVQ' },
  SK: { gst: 0.05, pst: 0.06, hst: 0, qst: 0, totalRate: 0.11, taxName: 'GST + PST' },
  YT: { gst: 0.05, pst: 0, hst: 0, qst: 0, totalRate: 0.05, taxName: 'GST' },
};

// Default if province unknown
const DEFAULT_TAX = TAX_RATES.ON;

// ─── Service Fee Constants ───

export const SERVICE_FEE_BASE = 1.00; // 1.00 CAD per passenger per trip
export const DRIVER_REGISTRATION_FEE = 0; // FREE

// ─── Pricing Functions ───

/**
 * Get tax breakdown for a province
 */
export function getProvinceTax(provinceCode: string): TaxBreakdown {
  return TAX_RATES[provinceCode.toUpperCase()] || DEFAULT_TAX;
}

/**
 * Extract province code from city string (e.g., "Montreal, QC" → "QC")
 */
export function extractProvinceCode(city: string): string {
  const parts = city.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const code = parts[parts.length - 1].toUpperCase();
    if (TAX_RATES[code]) return code;
  }
  return 'ON'; // Default to Ontario
}

/**
 * Calculate the complete price breakdown for a booking
 */
export function calculateBookingPrice(
  pricePerSeat: number,
  seats: number,
  provinceCode: string
): BookingPriceBreakdown {
  const tax = getProvinceTax(provinceCode);

  // Trip price (goes 100% to driver)
  const tripPrice = roundCents(pricePerSeat * seats);

  // Service fee: 1 CAD per passenger (per seat booked)
  const serviceFeeBase = roundCents(SERVICE_FEE_BASE * seats);

  // Taxes on the service fee only (not on the trip price — that's peer-to-peer)
  const serviceFeeGST = roundCents(serviceFeeBase * (tax.hst > 0 ? 0 : tax.gst));
  const serviceFeePST = roundCents(serviceFeeBase * tax.pst);
  const serviceFeeHST = roundCents(serviceFeeBase * tax.hst);
  const serviceFeeQST = roundCents(serviceFeeBase * tax.qst);
  const serviceFeeTax = roundCents(serviceFeeGST + serviceFeePST + serviceFeeHST + serviceFeeQST);

  // Total service fee with taxes
  const serviceFeeTotal = roundCents(serviceFeeBase + serviceFeeTax);

  // Total passenger pays
  const totalPassengerPays = roundCents(tripPrice + serviceFeeTotal);

  // Driver receives 100% of trip price
  const driverPayout = tripPrice;

  // Platform revenue (service fee before tax — taxes are remitted to CRA)
  const platformRevenue = serviceFeeBase;

  return {
    tripPrice,
    seats,
    pricePerSeat,
    serviceFeeBase,
    serviceFeeTax,
    serviceFeeTotal,
    taxBreakdown: {
      gst: serviceFeeGST,
      pst: serviceFeePST,
      hst: serviceFeeHST,
      qst: serviceFeeQST,
      taxName: tax.taxName,
      totalRate: tax.totalRate,
    },
    totalPassengerPays,
    driverPayout,
    platformRevenue,
    provinceCode,
  };
}

/**
 * Calculate Stripe amounts in cents for payment processing
 */
export function calculateStripeAmounts(breakdown: BookingPriceBreakdown) {
  // Total amount charged to passenger (in cents)
  const totalAmountCents = Math.round(breakdown.totalPassengerPays * 100);

  // Platform keeps the service fee (base + tax) as application_fee
  // Stripe processing fee (~2.9% + 30¢) is deducted by Stripe from the total
  const applicationFeeCents = Math.round(breakdown.serviceFeeTotal * 100);

  // The rest goes to the driver via Stripe Connect transfer
  // Driver gets: totalAmount - applicationFee (Stripe handles the split)
  return {
    totalAmountCents,
    applicationFeeCents,
    driverReceivesCents: totalAmountCents - applicationFeeCents,
  };
}

// ─── Types ───

export interface BookingPriceBreakdown {
  tripPrice: number;
  seats: number;
  pricePerSeat: number;
  serviceFeeBase: number;
  serviceFeeTax: number;
  serviceFeeTotal: number;
  taxBreakdown: {
    gst: number;
    pst: number;
    hst: number;
    qst: number;
    taxName: string;
    totalRate: number;
  };
  totalPassengerPays: number;
  driverPayout: number;
  platformRevenue: number;
  provinceCode: string;
}

// ─── Helpers ───

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Get all supported provinces with their tax info (for UI dropdowns)
 */
export function getAllProvinces(): Array<{ code: string; tax: TaxBreakdown }> {
  return Object.entries(TAX_RATES).map(([code, tax]) => ({ code, tax }));
}
