/**
 * CarpoolWork — employee records a carpool (Phase 2, brick 3).
 * Creating a log makes the employee a *measured* active participant this month.
 * Scoped to the logged-in user's own active membership.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const membershipId = String(body?.membershipId || '');
  if (!membershipId) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const m = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { userId: true, companyId: true, status: true },
  });
  if (!m || m.userId !== userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (m.status !== 'ACTIVE') return NextResponse.json({ error: 'not_active' }, { status: 409 });

  // Date: accept an ISO date within the last 31 days, else today.
  let date = new Date();
  if (typeof body?.date === 'string') {
    const d = new Date(body.date);
    if (!isNaN(d.getTime()) && d.getTime() <= Date.now() + 86400000 && d.getTime() > Date.now() - 31 * 86400000) {
      date = d;
    }
  }
  const partnerName = typeof body?.partnerName === 'string' ? body.partnerName.trim().slice(0, 80) || null : null;

  await prisma.carpoolLog.create({
    data: { companyId: m.companyId, membershipId, partnerName, date },
  });

  const monthCount = await prisma.carpoolLog.count({
    where: { membershipId, date: { gte: monthStart() } },
  });

  return NextResponse.json({ ok: true, monthCount });
}
