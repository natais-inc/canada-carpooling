import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import { sanitizeInput } from '@/lib/security';
import { z } from 'zod';

const messageSchema = z.object({
  receiverId: z.string(),
  tripId: z.string().optional(),
  content: z.string().min(1).max(2000),
});

// POST /api/messages — Send message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, tripId, content } = messageSchema.parse(body);

    // PIPEDA consent check
    const consentCheck = await requireValidConsent(session.user.id);
    if (consentCheck) return consentCheck;

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Verify receiver exists before creating message
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        tripId,
        content: sanitizeInput(content),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'New message',
        message: `${(session.user as any).firstName || 'Quelqu\'un'} vous a envoyé un message`,
        data: JSON.stringify({ messageId: message.id, tripId }),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/messages — List conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const withUser = searchParams.get('with');

    if (withUser) {
      // Get conversation with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: withUser },
            { senderId: withUser, receiverId: session.user.id },
          ],
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      // Mark as read
      await prisma.message.updateMany({
        where: { senderId: withUser, receiverId: session.user.id, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json(messages);
    }

    // Get conversation list (latest message per user)
    const sent = await prisma.message.findMany({
      where: { senderId: session.user.id },
      include: { receiver: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      distinct: ['receiverId'],
    });

    const received = await prisma.message.findMany({
      where: { receiverId: session.user.id },
      include: { sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId'],
    });

    // Merge and deduplicate
    const conversationMap = new Map();
    for (const msg of [...sent, ...received]) {
      const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      const other = msg.senderId === session.user.id ? (msg as any).receiver : (msg as any).sender;
      if (!conversationMap.has(otherId) || new Date(msg.createdAt) > new Date(conversationMap.get(otherId).lastMessage.createdAt)) {
        conversationMap.set(otherId, { user: other, lastMessage: msg });
      }
    }

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    console.error('List messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
