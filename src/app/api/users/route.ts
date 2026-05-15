import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import { sanitizeInput } from '@/lib/security';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  bio: z.string().max(500).optional(),
  preferredLanguage: z.enum(['fr', 'en']).optional(),
  profileImage: z.string().url().optional(),
});

// GET /api/users?id=xxx — Get user profile (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    // If no id, return current user profile
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          phoneVerified: true,
          profileImage: true,
          bio: true,
          preferredLanguage: true,
          verificationStatus: true,
          idVerified: true,
          licenseVerified: true,
          stripeAccountId: true, // needed to compute stripeConnected boolean
          averageRating: true,
          totalTripsAsDriver: true,
          totalTripsAsPassenger: true,
          responseRate: true,
          cancellationRate: true,
          createdAt: true,
          vehicles: true,
        },
      });

      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // Redact stripeAccountId — only expose connection status as boolean
      const { stripeAccountId, ...safeUser } = user;
      return NextResponse.json({ ...safeUser, stripeConnected: !!stripeAccountId });
    }

    // Public profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bio: true,
        verificationStatus: true,
        averageRating: true,
        totalTripsAsDriver: true,
        totalTripsAsPassenger: true,
        responseRate: true,
        createdAt: true,
        vehicles: {
          select: { make: true, model: true, year: true, color: true },
        },
        reviewsReceived: {
          where: { isVisible: true },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
            booking: {
              include: { trip: { select: { originCity: true, destinationCity: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users — Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PIPEDA consent check
    const consentCheck = await requireValidConsent(session.user.id);
    if (consentCheck) return consentCheck;

    const body = await req.json();
    const parsed = updateProfileSchema.parse(body);

    // Sanitize user-provided strings
    const data: Record<string, unknown> = { ...parsed };
    if (parsed.firstName) data.firstName = sanitizeInput(parsed.firstName);
    if (parsed.lastName) data.lastName = sanitizeInput(parsed.lastName);
    if (parsed.bio) data.bio = sanitizeInput(parsed.bio);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        bio: true,
        preferredLanguage: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
