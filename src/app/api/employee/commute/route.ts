/**
 * CarpoolWork — employee side: save the commute profile for one of the current
 * user's ACTIVE memberships. Scoped to the logged-in user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const FSA = /^[A-Za-z]\d[A-Za-z]$/; // Canadian forward sortation area

function clean(v: unknown, max = 120): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const membershipId = String(body?.membershipId || '');
  if (!membershipId) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const m = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { userId: true, status: true },
  });
  if (!m || m.userId !== userId) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (m.status !== 'ACTIVE') return NextResponse.json({ error: 'not_active' }, { status: 409 });

  const homeFsaRaw = clean(body?.homeFsa, 3);
  const homeFsa = homeFsaRaw && FSA.test(homeFsaRaw) ? homeFsaRaw.toUpperCase() : null;

  const days = Array.isArray(body?.commuteDays)
    ? body.commuteDays.filter((d: any) => Number.isInteger(d) && d >= 1 && d <= 7).join(',')
    : clean(body?.commuteDays, 20);

  const arriveBy = clean(body?.arriveBy, 5);
  const departAt = clean(body?.departAt, 5);
  const role = ['driver', 'passenger', 'either'].includes(body?.commuteRole) ? body.commuteRole : null;

  await prisma.companyMembership.update({
    where: { id: membershipId },
    data: {
      homeFsa,
      homeCity: clean(body?.homeCity, 80),
      workSite: clean(body?.workSite, 120),
      commuteDays: days || null,
      arriveBy: arriveBy && TIME.test(arriveBy) ? arriveBy : null,
      departAt: departAt && TIME.test(departAt) ? departAt : null,
      commuteRole: role,
    },
  });
  return NextResponse.json({ ok: true });
}
