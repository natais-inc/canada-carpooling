import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, status: 401, error: 'Unauthorized', userId: undefined };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return { ok: false as const, status: 403, error: 'Forbidden — admin only', userId };
  return { ok: true as const, userId };
}

// GET /api/admin/users — list users (admin only)
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      verificationStatus: true,
      isBanned: true,
      averageRating: true,
      totalTripsAsDriver: true,
      totalTripsAsPassenger: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

const patchSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['verify', 'reject', 'promote', 'demote', 'ban', 'unban']),
});

// PATCH /api/admin/users — act on a user (admin only)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { userId, action } = parsed.data;

  // Guard: an admin cannot demote or ban themselves.
  if (userId === auth.userId && (action === 'demote' || action === 'ban')) {
    return NextResponse.json({ error: 'You cannot apply this action to your own account.' }, { status: 400 });
  }

  const data: Record<string, any> = {};
  switch (action) {
    case 'verify':
      data.verificationStatus = 'verified';
      data.verifiedAt = new Date();
      break;
    case 'reject':
      data.verificationStatus = 'rejected';
      break;
    case 'promote':
      data.role = 'ADMIN';
      break;
    case 'demote':
      data.role = 'USER';
      break;
    case 'ban':
      data.isBanned = true;
      break;
    case 'unban':
      data.isBanned = false;
      break;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, role: true, verificationStatus: true, isBanned: true },
  });
  return NextResponse.json({ user: updated });
}
