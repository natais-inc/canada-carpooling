import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import { sanitizeInput } from '@/lib/security';
import { z } from 'zod';

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  punctuality: z.number().min(1).max(5).optional(),
  safety: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  comfort: z.number().min(1).max(5).optional(),
});

// POST /api/reviews — Create review
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
    const data = reviewSchema.parse(body);

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { trip: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed trips' }, { status: 400 });
    }

    // Time-window check: reviews must be submitted within 30 days of trip completion
    const tripDate = booking.trip.departureDate;
    const reviewDeadline = new Date(tripDate);
    reviewDeadline.setDate(reviewDeadline.getDate() + 30);
    if (new Date() > reviewDeadline) {
      return NextResponse.json({ error: 'Review period expired (30 days)' }, { status: 400 });
    }

    // Determine target: if user is passenger, review driver; if driver, review passenger
    const isPassenger = booking.passengerId === session.user.id;
    const isDriver = booking.trip.driverId === session.user.id;

    if (!isPassenger && !isDriver) {
      return NextResponse.json({ error: 'Not part of this booking' }, { status: 403 });
    }

    const targetId = isPassenger ? booking.trip.driverId : booking.passengerId;

    // Check existing review from this user for this booking
    const existing = await prisma.review.findFirst({
      where: { bookingId: data.bookingId, authorId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 400 });
    }

    // Use a transaction to atomically create review + update average rating
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId: data.bookingId,
          authorId: session.user.id,
          targetId,
          rating: data.rating,
          comment: data.comment ? sanitizeInput(data.comment) : undefined,
          punctuality: data.punctuality,
          safety: data.safety,
          communication: data.communication,
          comfort: data.comfort,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
      });

      // Recalculate average rating atomically
      const allReviews = await tx.review.findMany({
        where: { targetId, isVisible: true },
        select: { rating: true },
      });
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      await tx.user.update({
        where: { id: targetId },
        data: { averageRating: Math.round(avgRating * 10) / 10 },
      });

      // Notification inside transaction
      await tx.notification.create({
        data: {
          userId: targetId,
          type: 'NEW_REVIEW',
          title: 'New review',
          message: `${(session.user as any).firstName || 'Quelqu\'un'} vous a laissé un avis de ${data.rating} étoile${data.rating > 1 ? 's' : ''}`,
          data: JSON.stringify({ reviewId: newReview.id, bookingId: data.bookingId }),
        },
      });

      return newReview;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reviews?userId=xxx — Get reviews for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { targetId: userId, isVisible: true },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        booking: {
          include: {
            trip: { select: { originCity: true, destinationCity: true, departureDate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Aggregate stats
    const stats = {
      count: reviews.length,
      average: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      categories: {
        punctuality: 0,
        safety: 0,
        communication: 0,
        comfort: 0,
      },
    };

    let catCounts = { punctuality: 0, safety: 0, communication: 0, comfort: 0 };
    for (const r of reviews) {
      stats.breakdown[r.rating]++;
      if (r.punctuality) { stats.categories.punctuality += r.punctuality; catCounts.punctuality++; }
      if (r.safety) { stats.categories.safety += r.safety; catCounts.safety++; }
      if (r.communication) { stats.categories.communication += r.communication; catCounts.communication++; }
      if (r.comfort) { stats.categories.comfort += r.comfort; catCounts.comfort++; }
    }

    if (catCounts.punctuality) stats.categories.punctuality /= catCounts.punctuality;
    if (catCounts.safety) stats.categories.safety /= catCounts.safety;
    if (catCounts.communication) stats.categories.communication /= catCounts.communication;
    if (catCounts.comfort) stats.categories.comfort /= catCounts.comfort;

    return NextResponse.json({ reviews, stats });
  } catch (error: unknown) {
    console.error('List reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
