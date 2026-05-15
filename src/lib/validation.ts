import { z } from 'zod';
import { sanitizeInput } from '@/lib/security';

// ─── Reusable field schemas ─────────────────────────────────────────

/** Safe string: trimmed, sanitized, non-empty */
export const safeString = (min = 1, max = 255) =>
  z.string().min(min).max(max).transform(sanitizeInput);

/** Canadian phone: 10 digits, optional +1 prefix */
export const canadianPhone = z
  .string()
  .regex(/^(\+1)?[2-9]\d{9}$/, 'Invalid Canadian phone number / Numéro de téléphone canadien invalide')
  .transform((v) => v.replace(/\D/g, '').slice(-10));

/** Email: lowercased, max 255 */
export const emailField = z.string().email().max(255).toLowerCase();

/** Password: 8-128 chars */
export const passwordField = z.string().min(8).max(128);

/** Positive integer ID */
export const idParam = z.string().regex(/^\d+$/).transform(Number);

/** UUID */
export const uuidParam = z.string().uuid();

/** Canadian postal code */
export const postalCode = z
  .string()
  .regex(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Invalid postal code / Code postal invalide')
  .transform((v) => v.toUpperCase().replace(/\s/g, ''));

/** Latitude -90 to 90 */
export const latitude = z.number().min(-90).max(90);

/** Longitude -180 to 180 */
export const longitude = z.number().min(-180).max(180);

/** Price in cents (positive integer) */
export const priceInCents = z.number().int().min(0);

/** Date in ISO format */
export const isoDate = z.string().datetime();

/** Future date only */
export const futureDate = z.string().datetime().refine(
  (d) => new Date(d) > new Date(),
  'Date must be in the future / La date doit être dans le futur'
);

/** Pagination params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Sort order */
export const sortOrder = z.enum(['asc', 'desc']).default('desc');

// ─── Booking validation ─────────────────────────────────────────────

export const createBookingSchema = z.object({
  rideId: z.string().min(1),
  seatsRequested: z.number().int().min(1).max(8),
  pickupNote: safeString(0, 500).optional(),
});

// ─── Ride validation ────────────────────────────────────────────────

export const createRideSchema = z.object({
  departureCity: safeString(1, 100),
  arrivalCity: safeString(1, 100),
  departureAddress: safeString(1, 255),
  arrivalAddress: safeString(1, 255),
  departureLatitude: latitude,
  departureLongitude: longitude,
  arrivalLatitude: latitude,
  arrivalLongitude: longitude,
  departureDate: futureDate,
  availableSeats: z.number().int().min(1).max(8),
  pricePerSeat: z.number().min(0).max(999),
  description: safeString(0, 1000).optional(),
  vehicleId: z.string().min(1),
  stops: z.array(z.object({
    city: safeString(1, 100),
    address: safeString(1, 255),
    latitude: latitude,
    longitude: longitude,
    order: z.number().int().min(0),
  })).max(10).optional(),
});

// ─── Search validation ──────────────────────────────────────────────

export const searchRidesSchema = z.object({
  from: safeString(1, 100),
  to: safeString(1, 100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seats: z.coerce.number().int().min(1).max(8).default(1),
  ...paginationSchema.shape,
});

// ─── Message validation ─────────────────────────────────────────────

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: safeString(1, 2000),
  rideId: z.string().optional(),
});

// ─── Review validation ──────────────────────────────────────────────

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: safeString(0, 1000).optional(),
});

// ─── Helper: parse request body with Zod ────────────────────────────

/**
 * Parse JSON body against a Zod schema.
 * Throws ZodError on failure (caught by apiHandler → 400).
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await req.json().catch(() => {
    throw new Error('Invalid JSON body / Corps JSON invalide');
  });
  return schema.parse(body);
}

/**
 * Parse URL search params against a Zod schema.
 */
export function parseQuery<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): z.infer<T> {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  return schema.parse(params);
}
