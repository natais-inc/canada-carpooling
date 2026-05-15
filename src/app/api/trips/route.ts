import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import { sanitizeInput } from '@/lib/security';
import { z } from 'zod';

// GET /api/trips — Search trips
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const seats = searchParams.get('seats');
    const sort = searchParams.get('sort') || 'departureTime';

    const where: any = {
      status: 'ACTIVE',
      departureDate: { gte: new Date() },
    };

    if (from) where.originCity = { contains: from, mode: 'insensitive' };
    if (to) where.destinationCity = { contains: to, mode: 'insensitive' };
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureDate = { gte: d, lt: nextDay };
    }
    if (seats) where.availableSeats = { gte: parseInt(seats) };

    const orderBy: any = sort === 'price' ? { pricePerSeat: 'asc' } : sort === 'rating' ? { driver: { averageRating: 'desc' } } : { departureTime: 'asc' };

    const trips = await prisma.trip.findMany({
      where,
      orderBy,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, profileImage: true, averageRating: true, totalTripsAsDriver: true, verificationStatus: true } },
        stops: { orderBy: { order: 'asc' } },
        _count: { select: { bookings: true } },
      },
      take: 50,
    });

    const formatted = trips.map((t: any) => ({
      ...t,
      driver: {
        ...t.driver,
        isVerified: t.driver.verificationStatus === 'verified',
      },
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error('Search trips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/trips — Create trip
const createTripSchema = z.object({
  originCity: z.string().min(2),
  destinationCity: z.string().min(2),
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  departureDate: z.string(),
  departureTime: z.string(),
  estimatedDuration: z.number().optional(),
  pricePerSeat: z.number().min(5).max(500),
  availableSeats: z.number().min(1).max(8),
  notes: z.string().optional(),
  allowPets: z.boolean().default(false),
  allowSmoking: z.boolean().default(false),
  allowMusic: z.boolean().default(true),
  luggageSize: z.enum(['small', 'medium', 'large']).default('medium'),
  vehicleId: z.string().optional(),
  stops: z.array(z.object({
    city: z.string(),
    priceFromOrigin: z.number().optional(),
    order: z.number(),
  })).optional(),
});

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
    const data = createTripSchema.parse(body);

    // Validate departure date is in the future
    const departureDate = new Date(data.departureDate);
    if (isNaN(departureDate.getTime())) {
      return NextResponse.json({ error: 'Invalid departure date' }, { status: 400 });
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Compare dates, not times
    if (departureDate < now) {
      return NextResponse.json({ error: 'Departure date must be in the future' }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        driverId: session.user.id,
        originCity: sanitizeInput(data.originCity),
        destinationCity: sanitizeInput(data.destinationCity),
        originAddress: data.originAddress ? sanitizeInput(data.originAddress) : undefined,
        destinationAddress: data.destinationAddress ? sanitizeInput(data.destinationAddress) : undefined,
        departureDate: new Date(data.departureDate),
        departureTime: data.departureTime,
        estimatedDuration: data.estimatedDuration,
        pricePerSeat: data.pricePerSeat,
        availableSeats: data.availableSeats,
        totalSeats: data.availableSeats,
        notes: data.notes ? sanitizeInput(data.notes) : undefined,
        allowPets: data.allowPets,
        allowSmoking: data.allowSmoking,
        allowMusic: data.allowMusic,
        luggageSize: data.luggageSize,
        vehicleId: data.vehicleId,
        stops: data.stops ? {
          create: data.stops.map(s => ({
            city: sanitizeInput(s.city),
            priceFromOrigin: s.priceFromOrigin,
            order: s.order,
          })),
        } : undefined,
      },
      include: { stops: true },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
