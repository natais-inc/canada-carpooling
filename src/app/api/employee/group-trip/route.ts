/**
 * CarpoolWork — confirm a group carpool for the day (auto-validation).
 * The driver of the day taps once; this logs a carpool for EVERY active member
 * of the group that day, so nobody has to remember to record their own. Already
 * logged members that day are skipped (one log per member per day).
 *   POST { groupId, membershipId, date? } → { logged }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function dayBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const groupId = String(body?.groupId || '');
  const membershipId = String(body?.membershipId || '');
  if (!groupId || !membershipId) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  // Caller must own this membership and be an ACTIVE member of the group.
  const me = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, userId: true, companyId: true, status: true },
  });
  if (!me || me.userId !== userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const myMembership = await prisma.carpoolGroupMember.findUnique({
    where: { groupId_membershipId: { groupId, membershipId } },
    select: { status: true, group: { select: { companyId: true } } },
  });
  if (!myMembership || myMembership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'not_group_member' }, { status: 403 });
  }

  // Trip date: today, or an ISO date within the last 31 days.
  let date = new Date();
  if (typeof body?.date === 'string') {
    const d = new Date(body.date);
    if (!isNaN(d.getTime()) && d.getTime() <= Date.now() + 86400000 && d.getTime() > Date.now() - 31 * 86400000) {
      date = d;
    }
  }
  const { start, end } = dayBounds(date);
  const companyId = myMembership.group.companyId;

  // Every ACTIVE member of the group.
  const members = await prisma.carpoolGroupMember.findMany({
    where: { groupId, status: 'ACTIVE' },
    select: { membershipId: true },
  });

  let logged = 0;
  for (const mm of members) {
    const already = await prisma.carpoolLog.findFirst({
      where: { membershipId: mm.membershipId, date: { gte: start, lt: end } },
      select: { id: true },
    });
    if (already) continue;
    await prisma.carpoolLog.create({
      data: {
        companyId,
        membershipId: mm.membershipId,
        date,
        groupId,
        driverMembershipId: membershipId,
      },
    });
    logged += 1;
  }

  return NextResponse.json({ ok: true, logged, members: members.length });
}
