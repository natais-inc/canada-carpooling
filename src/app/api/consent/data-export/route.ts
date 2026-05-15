import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requestDataExport } from '@/lib/consent';
import { prisma } from '@/lib/db';

// POST /api/consent/data-export — Request data export (PIPEDA Principle 9)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requestDataExport(session.user.id, req);

    return NextResponse.json({
      success: true,
      message: 'Data export request recorded. You will receive your data within 30 days as required by PIPEDA.',
    });
  } catch (error: unknown) {
    console.error('Data export request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/consent/data-export — Download user data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data (PIPEDA right of access)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        preferredLanguage: true,
        averageRating: true,
        totalTripsAsDriver: true,
        totalTripsAsPassenger: true,
        consentAt: true,
        consentVersion: true,
        privacyPolicyAccepted: true,
        termsAccepted: true,
        marketingConsent: true,
        locationConsent: true,
        createdAt: true,
        updatedAt: true,
        // Exclude: passwordHash, stripeCustomerId, stripeAccountId, internal IDs
      },
    });

    const bookings = await prisma.booking.findMany({
      where: { passengerId: session.user.id },
      select: {
        id: true,
        seatsBooked: true,
        totalPrice: true,
        serviceFee: true,
        status: true,
        paymentStatus: true,
        pickupLocation: true,
        dropoffLocation: true,
        createdAt: true,
      },
    });

    const trips = await prisma.trip.findMany({
      where: { driverId: session.user.id },
      select: {
        id: true,
        originCity: true,
        destinationCity: true,
        departureDate: true,
        departureTime: true,
        pricePerSeat: true,
        availableSeats: true,
        totalSeats: true,
        status: true,
        createdAt: true,
      },
    });

    const reviewsGiven = await prisma.review.findMany({
      where: { authorId: session.user.id },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });

    const reviewsReceived = await prisma.review.findMany({
      where: { targetId: session.user.id },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
      select: { id: true, content: true, createdAt: true, senderId: true },
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: session.user.id },
      select: { id: true, make: true, model: true, year: true, color: true, seats: true },
    });

    const consentHistory = await prisma.consentLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user,
      trips,
      bookings,
      reviewsGiven,
      reviewsReceived,
      messages: messages.map((m: any) => ({
        ...m,
        direction: m.senderId === session.user.id ? 'sent' : 'received',
      })),
      vehicles,
      consentHistory,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="data-export-${session.user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
