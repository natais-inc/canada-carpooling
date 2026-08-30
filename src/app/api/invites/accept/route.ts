/**
 * CarpoolWork — accept a company invite by token (Phase 4).
 * The logged-in user joins the company; the click is the consent, so the
 * membership is created ACTIVE. Idempotent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const token = String(body?.token || '');
  if (!token) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const invite = await prisma.companyInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (invite.status === 'REVOKED') return NextResponse.json({ error: 'revoked' }, { status: 409 });
  if (invite.status !== 'ACCEPTED' && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'expired' }, { status: 410 });
  }

  // Join the company (consent via the click) — idempotent upsert.
  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId, companyId: invite.companyId } },
    update: { status: 'ACTIVE', acceptedAt: new Date(), ...(invite.department ? { department: invite.department } : {}) },
    create: {
      userId,
      companyId: invite.companyId,
      role: 'MEMBER',
      status: 'ACTIVE',
      acceptedAt: new Date(),
      department: invite.department,
    },
  });

  if (invite.status === 'PENDING') {
    await prisma.companyInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedByUserId: userId, acceptedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, companyId: invite.companyId });
}
