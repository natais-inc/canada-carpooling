import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateNotificationsSchema = z.object({
  notificationIds: z.array(z.string()).max(100).optional(),
  markAllRead: z.boolean().optional(),
}).refine(
  (data) => data.markAllRead || (data.notificationIds && data.notificationIds.length > 0),
  { message: 'Either markAllRead or notificationIds must be provided' }
);

// GET /api/notifications — List user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    // Clamp limit to a safe range to prevent abuse
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: unknown) {
    console.error('List notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications — Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateNotificationsSchema.parse(body);

    if (data.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (data.notificationIds?.length) {
      await prisma.notification.updateMany({
        where: {
          id: { in: data.notificationIds },
          userId: session.user.id, // ownership check prevents marking others' notifications
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
