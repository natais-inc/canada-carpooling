/**
 * CarpoolWork — employee side: the current user's company memberships.
 * GET lists the user's invitations + active memberships; PATCH accepts or
 * declines one. Everything is scoped to the logged-in user's own memberships.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function uid() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET() {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await prisma.companyMembership.findMany({
      where: { userId, status: { in: ['INVITED', 'ACTIVE'] } },
      select: {
        id: true, status: true, role: true, department: true,
        homeFsa: true, homeCity: true, workSite: true,
        commuteDays: true, arriveBy: true, departAt: true, commuteRole: true,
        company: { select: { id: true, name: true, region: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ memberships: rows });
  } catch {
    // Tables/columns not migrated yet — treat as no memberships rather than 500.
    return NextResponse.json({ memberships: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const membershipId = String(body?.membershipId || '');
  const action = String(body?.action || '');
  if (!membershipId || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'invalid_args' }, { status: 400 });
  }

  const m = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { userId: true, status: true },
  });
  if (!m || m.userId !== userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (action === 'accept') {
    await prisma.companyMembership.update({
      where: { id: membershipId },
      data: { status: 'ACTIVE', acceptedAt: new Date() },
    });
  } else {
    await prisma.companyMembership.update({
      where: { id: membershipId },
      data: { status: 'REMOVED' },
    });
  }
  return NextResponse.json({ ok: true });
}
