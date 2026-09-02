/**
 * CarpoolWork — carpool groups (2–4 colleagues who alternate as driver).
 * A group belongs to a company; members are ACTIVE memberships of that company.
 *   GET   → the caller's groups (invited + active) with members
 *   POST  { membershipId, name, memberEmails[] } → create a group
 *   PATCH { groupId, membershipId, action:'accept'|'decline'|'leave' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_MEMBERS = 4;

async function callerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as { id?: string } | undefined)?.id) ?? null;
}

/** The caller's own membership by id, or null if it isn't theirs. */
async function ownMembership(userId: string, membershipId: string) {
  const m = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, userId: true, companyId: true, status: true },
  });
  if (!m || m.userId !== userId) return null;
  return m;
}

type MemberOut = { membershipId: string; name: string; status: string; isCreator: boolean };

async function shapeGroup(groupId: string) {
  const g = await prisma.carpoolGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true, name: true, createdByMembershipId: true,
      members: {
        where: { status: { in: ['INVITED', 'ACTIVE'] } },
        select: {
          membershipId: true,
          status: true,
          membership: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });
  if (!g) return null;
  type RawMember = { membershipId: string; status: string; membership: { user: { firstName: string | null; lastName: string | null } } };
  const members: MemberOut[] = (g.members as RawMember[]).map((mm) => ({
    membershipId: mm.membershipId,
    name: [mm.membership.user.firstName, mm.membership.user.lastName].filter(Boolean).join(' ').trim() || '—',
    status: mm.status,
    isCreator: mm.membershipId === g.createdByMembershipId,
  }));
  return { id: g.id, name: g.name, createdByMembershipId: g.createdByMembershipId, members };
}

export async function GET() {
  const userId = await callerUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const mine = await prisma.carpoolGroupMember.findMany({
      where: { status: { in: ['INVITED', 'ACTIVE'] }, membership: { userId } },
      select: { groupId: true, status: true, membershipId: true },
    });
    const groups = [];
    for (const row of mine) {
      const shaped = await shapeGroup(row.groupId);
      if (shaped) groups.push({ ...shaped, myMembershipId: row.membershipId, myStatus: row.status });
    }
    return NextResponse.json({ groups });
  } catch {
    // Table may not exist pre-migration — degrade gracefully.
    return NextResponse.json({ groups: [] });
  }
}

export async function POST(req: NextRequest) {
  const userId = await callerUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const membershipId = String(body?.membershipId || '');
  const name = String(body?.name || '').trim().slice(0, 80);
  const emails: string[] = Array.isArray(body?.memberEmails)
    ? body.memberEmails.map((e: unknown) => String(e || '').trim().toLowerCase()).filter(Boolean)
    : [];
  if (!membershipId || !name) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const me = await ownMembership(userId, membershipId);
  if (!me) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (me.status !== 'ACTIVE') return NextResponse.json({ error: 'not_active' }, { status: 409 });

  const group = await prisma.carpoolGroup.create({
    data: { companyId: me.companyId, name, createdByMembershipId: membershipId },
    select: { id: true },
  });
  // Creator is an active member.
  await prisma.carpoolGroupMember.create({
    data: { groupId: group.id, membershipId, status: 'ACTIVE' },
  });

  // Invite colleagues (active members of the same company) by email.
  let invited = 0;
  for (const email of emails.slice(0, MAX_MEMBERS - 1)) {
    const colleague = await prisma.companyMembership.findFirst({
      where: { companyId: me.companyId, status: 'ACTIVE', user: { email } },
      select: { id: true },
    });
    if (!colleague || colleague.id === membershipId) continue;
    try {
      await prisma.carpoolGroupMember.create({
        data: { groupId: group.id, membershipId: colleague.id, status: 'INVITED' },
      });
      invited += 1;
    } catch {
      /* already in group — ignore */
    }
    if (1 + invited >= MAX_MEMBERS) break;
  }

  const shaped = await shapeGroup(group.id);
  return NextResponse.json({ ok: true, group: shaped, invited });
}

export async function PATCH(req: NextRequest) {
  const userId = await callerUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const groupId = String(body?.groupId || '');
  const membershipId = String(body?.membershipId || '');
  const action = String(body?.action || '');
  if (!groupId || !membershipId || !['accept', 'decline', 'leave'].includes(action)) {
    return NextResponse.json({ error: 'invalid_args' }, { status: 400 });
  }

  const me = await ownMembership(userId, membershipId);
  if (!me) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const gm = await prisma.carpoolGroupMember.findUnique({
    where: { groupId_membershipId: { groupId, membershipId } },
    select: { id: true },
  });
  if (!gm) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const status = action === 'accept' ? 'ACTIVE' : action === 'decline' ? 'DECLINED' : 'REMOVED';
  await prisma.carpoolGroupMember.update({ where: { id: gm.id }, data: { status } });
  return NextResponse.json({ ok: true });
}
