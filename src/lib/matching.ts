/**
 * CarpoolWork — commute matching (Phase 2, brick 2).
 * Given one of the current user's active memberships, find compatible
 * colleagues in the same company: shared commute days, same neighbourhood
 * (postal FSA), similar times, and complementary driver/passenger roles.
 * Pure scoring — no geocoding — so it runs anywhere and stays explainable.
 */
import { prisma } from '@/lib/db';

export type Match = {
  membershipId: string;
  name: string;
  department: string | null;
  sharedDays: number[];
  sameFsa: boolean;
  sameCity: boolean;
  timeGapMin: number | null; // minutes between arrival times, if both known
  role: string | null;
  score: number;
};

function parseDays(csv: string | null): number[] {
  if (!csv) return [];
  return csv.split(',').map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= 7);
}

function toMin(t: string | null): number | null {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function rolesCompatible(a: string | null, b: string | null): boolean {
  // Two riders don't help each other; a driver + passenger (or either) do.
  if (!a || !b || a === 'either' || b === 'either') return true;
  return a !== b; // driver + passenger
}

/**
 * Compatible colleagues for the given membership, best first.
 * Returns null if the membership isn't the caller's or isn't active.
 */
export async function findMatches(userId: string, membershipId: string): Promise<Match[] | null> {
  const me = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: {
      userId: true, companyId: true, status: true,
      homeFsa: true, homeCity: true, commuteDays: true, arriveBy: true, commuteRole: true,
    },
  });
  if (!me || me.userId !== userId || me.status !== 'ACTIVE') return null;

  const myDays = parseDays(me.commuteDays);
  const myArrive = toMin(me.arriveBy);

  const candidates = await prisma.companyMembership.findMany({
    where: {
      companyId: me.companyId,
      status: 'ACTIVE',
      userId: { not: userId },
    },
    select: {
      id: true, department: true,
      homeFsa: true, homeCity: true, commuteDays: true, arriveBy: true, commuteRole: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  const matches: Match[] = [];
  for (const c of candidates) {
    const cDays = parseDays(c.commuteDays);
    const sharedDays = myDays.filter((d) => cDays.includes(d));

    const sameFsa = !!(me.homeFsa && c.homeFsa && me.homeFsa === c.homeFsa);
    const sameCity =
      !sameFsa && !!(me.homeCity && c.homeCity && me.homeCity.trim().toLowerCase() === c.homeCity.trim().toLowerCase());

    const cArrive = toMin(c.arriveBy);
    const timeGapMin = myArrive != null && cArrive != null ? Math.abs(myArrive - cArrive) : null;

    // Require at least a shared day OR the same neighbourhood — otherwise it's not a real lead.
    if (sharedDays.length === 0 && !sameFsa && !sameCity) continue;

    let score = 0;
    score += sharedDays.length * 10;
    if (sameFsa) score += 40;
    else if (sameCity) score += 15;
    if (timeGapMin != null) {
      if (timeGapMin <= 30) score += 20;
      else if (timeGapMin <= 60) score += 10;
    }
    if (rolesCompatible(me.commuteRole, c.commuteRole)) score += 15;

    matches.push({
      membershipId: c.id,
      name: `${c.user.firstName} ${(c.user.lastName || '').charAt(0)}.`.trim(),
      department: c.department,
      sharedDays,
      sameFsa,
      sameCity,
      timeGapMin,
      role: c.commuteRole,
      score,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 8);
}
