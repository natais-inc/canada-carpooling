import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import MyCommute, { type EmployeeMembership, type PersonalImpact } from './MyCommute';
import { findMatches, type Match } from '@/lib/matching';
import { measuredImpact } from '@/lib/impact';

export const dynamic = 'force-dynamic';

// Employee side — Phase 2 brick 1: accept the employer invitation and declare
// the commute profile. Access requires login; the page only shows the user's
// own memberships.
export default async function MyCarpoolPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  let memberships: EmployeeMembership[] = [];
  try {
    const rows = await prisma.companyMembership.findMany({
      where: { userId, status: { in: ['INVITED', 'ACTIVE'] } },
      select: {
        id: true, status: true, department: true,
        homeFsa: true, homeCity: true, workSite: true,
        commuteDays: true, arriveBy: true, departAt: true, commuteRole: true,
        homeLat: true, homeLng: true,
        company: { select: { name: true, region: true, avgCommuteKm: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    memberships = rows as unknown as EmployeeMembership[];
  } catch {
    memberships = [];
  }

  const active = memberships.filter((m) => m.status === 'ACTIVE');

  // Matches for each active membership (best-effort).
  let matchesByMembership: Record<string, Match[]> = {};
  try {
    const entries = await Promise.all(
      active.map(async (m) => [m.id, (await findMatches(userId, m.id)) || []] as const)
    );
    matchesByMembership = Object.fromEntries(entries);
  } catch {
    matchesByMembership = {};
  }

  // Carpools recorded this month + all-time, per active membership (measured
  // participation), turned into the member's own impact (brick 4). Also a
  // gentle engagement nudge when a set-up member hasn't logged in 7 days.
  let carpoolCountByMembership: Record<string, number> = {};
  let impactByMembership: Record<string, PersonalImpact> = {};
  let nudgeByMembership: Record<string, boolean> = {};
  try {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const entries = await Promise.all(
      active.map(async (m) => {
        const [monthCarpools, allTimeCarpools, lastLog] = await Promise.all([
          prisma.carpoolLog.count({ where: { membershipId: m.id, date: { gte: monthStart } } }),
          prisma.carpoolLog.count({ where: { membershipId: m.id } }),
          prisma.carpoolLog.findFirst({ where: { membershipId: m.id }, orderBy: { date: 'desc' }, select: { date: true } }),
        ]);
        const avgKm = (m as any).company?.avgCommuteKm ?? 0;
        const month = measuredImpact(monthCarpools, avgKm);
        const total = measuredImpact(allTimeCarpools, avgKm);
        const impact: PersonalImpact = {
          monthCarpools,
          allTimeCarpools,
          monthKm: month.kmShared,
          monthCo2Kg: month.co2Kg,
          allTimeKm: total.kmShared,
          allTimeCo2Kg: total.co2Kg,
          allTimeTrees: total.trees,
        };
        // Nudge a member who has declared a commute but hasn't logged recently.
        const hasCommute = !!m.commuteDays;
        const nudge = hasCommute && (!lastLog || lastLog.date < sevenDaysAgo);
        return [m.id, { monthCarpools, impact, nudge }] as const;
      })
    );
    carpoolCountByMembership = Object.fromEntries(entries.map(([id, v]) => [id, v.monthCarpools]));
    impactByMembership = Object.fromEntries(entries.map(([id, v]) => [id, v.impact]));
    nudgeByMembership = Object.fromEntries(entries.map(([id, v]) => [id, v.nudge]));
  } catch {
    carpoolCountByMembership = {};
    impactByMembership = {};
    nudgeByMembership = {};
  }

  return (
    <MyCommute
      memberships={memberships}
      matchesByMembership={matchesByMembership}
      carpoolCountByMembership={carpoolCountByMembership}
      impactByMembership={impactByMembership}
      nudgeByMembership={nudgeByMembership}
      locale={locale}
    />
  );
}
