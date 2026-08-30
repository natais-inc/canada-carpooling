/**
 * CarpoolWork — NATAIS platform overview (Phase 3, super-admin).
 * Aggregates every client company: trial/subscription status, measured active
 * participants, monthly run-rate and last-month billable revenue. Read-only.
 * Access is gated to platform admins (User.role === 'ADMIN') by the API route.
 */
import { prisma } from '@/lib/db';
import { BILLING } from '@/lib/billing';

export type PlatformCompany = {
  id: string;
  name: string;
  region: string | null;
  tier: 'STANDARD' | 'ENTERPRISE';
  trialActive: boolean;
  trialDaysLeft: number;
  trialEndsAtIso: string;
  activeParticipants: number; // this month
  runRateCents: number; // this month participants × price
  lastMonthParticipants: number;
  lastMonthBillableCents: number; // 0 if that month was covered by the trial
  pricePerParticipantCents: number;
  totalMembers: number;
};

export type PlatformOverview = {
  generatedAtIso: string;
  totals: {
    companies: number;
    trialing: number;
    paying: number; // trial ended
    activeParticipants: number;
    monthlyRunRateCents: number; // potential MRR at current participation
    lastMonthBillableCents: number; // revenue that would be invoiced now
  };
  companies: PlatformCompany[];
};

function monthStart(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

// distinct active participants per company for a [from, to) window, one query.
async function participantsByCompany(from: Date, to: Date): Promise<Map<string, number>> {
  const rows = await prisma.carpoolLog.groupBy({
    by: ['companyId', 'membershipId'],
    where: { date: { gte: from, lt: to } },
  });
  const map = new Map<string, number>();
  for (const r of rows as { companyId: string; membershipId: string }[]) {
    map.set(r.companyId, (map.get(r.companyId) ?? 0) + 1);
  }
  return map;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const now = new Date();
  const curFrom = monthStart(now.getFullYear(), now.getMonth());
  const curTo = monthStart(now.getFullYear(), now.getMonth() + 1);
  const prevFrom = monthStart(now.getFullYear(), now.getMonth() - 1);
  const prevTo = curFrom;

  const [companies, curMap, prevMap] = await Promise.all([
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        region: true,
        subscriptionTier: true,
        trialStartAt: true,
        pricePerParticipantCents: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    participantsByCompany(curFrom, curTo),
    participantsByCompany(prevFrom, prevTo),
  ]);

  type CompanyRow = {
    id: string;
    name: string;
    region: string | null;
    subscriptionTier: string | null;
    trialStartAt: Date | null;
    pricePerParticipantCents: number | null;
    createdAt: Date;
    _count: { memberships: number };
  };

  const rows: PlatformCompany[] = (companies as CompanyRow[]).map((c) => {
    const price = c.pricePerParticipantCents ?? BILLING.DEFAULT_PRICE_CENTS;
    const tier: 'STANDARD' | 'ENTERPRISE' = c.subscriptionTier === 'ENTERPRISE' ? 'ENTERPRISE' : 'STANDARD';
    const trialStart = c.trialStartAt ?? c.createdAt;
    const trialEnd = new Date(trialStart.getTime() + BILLING.TRIAL_DAYS * 86400000);
    const trialActive = now < trialEnd;
    const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));

    const activeParticipants = curMap.get(c.id) ?? 0;
    const lastMonthParticipants = prevMap.get(c.id) ?? 0;
    // The previous month is covered by the trial when it began before the trial ended.
    const prevMonthFree = prevFrom < trialEnd;
    const lastMonthBillableCents = prevMonthFree ? 0 : lastMonthParticipants * price;

    return {
      id: c.id,
      name: c.name,
      region: c.region,
      tier,
      trialActive,
      trialDaysLeft,
      trialEndsAtIso: trialEnd.toISOString(),
      activeParticipants,
      runRateCents: activeParticipants * price,
      lastMonthParticipants,
      lastMonthBillableCents,
      pricePerParticipantCents: price,
      totalMembers: c._count.memberships,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.companies += 1;
      if (r.trialActive) acc.trialing += 1;
      else acc.paying += 1;
      acc.activeParticipants += r.activeParticipants;
      acc.monthlyRunRateCents += r.runRateCents;
      acc.lastMonthBillableCents += r.lastMonthBillableCents;
      return acc;
    },
    { companies: 0, trialing: 0, paying: 0, activeParticipants: 0, monthlyRunRateCents: 0, lastMonthBillableCents: 0 }
  );

  return { generatedAtIso: now.toISOString(), totals, companies: rows };
}
