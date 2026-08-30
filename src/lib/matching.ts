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
  distanceKm: number | null; // straight-line home distance, if both located
  within2km: boolean;
  timeGapMin: number | null; // minutes between arrival times, if both known
  role: string | null;
  score: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

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
      homeFsa: true, homeCity: true, homeLat: true, homeLng: true,
      commuteDays: true, arriveBy: true, commuteRole: true,
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
      homeFsa: true, homeCity: true, homeLat: true, homeLng: true,
      commuteDays: true, arriveBy: true, commuteRole: true,
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

    const distanceKm =
      me.homeLat != null && me.homeLng != null && c.homeLat != null && c.homeLng != null
        ? Math.round(haversineKm(me.homeLat, me.homeLng, c.homeLat, c.homeLng) * 10) / 10
        : null;
    const within2km = distanceKm != null && distanceKm <= 2;

    const cArrive = toMin(c.arriveBy);
    const timeGapMin = myArrive != null && cArrive != null ? Math.abs(myArrive - cArrive) : null;

    // Need some commonality: a shared day, same neighbourhood, or reasonable proximity.
    const near = distanceKm != null && distanceKm <= 10;
    if (sharedDays.length === 0 && !sameFsa && !sameCity && !near) continue;

    let score = 0;
    score += sharedDays.length * 10;
    // Proximity: prefer real distance when both are located, else fall back to postal area.
    if (distanceKm != null) {
      if (distanceKm <= 2) score += 50;
      else if (distanceKm <= 5) score += 25;
      else if (distanceKm <= 10) score += 10;
    } else if (sameFsa) {
      score += 40;
    } else if (sameCity) {
      score += 15;
    }
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
      distanceKm,
      within2km,
      timeGapMin,
      role: c.commuteRole,
      score,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 8);
}
