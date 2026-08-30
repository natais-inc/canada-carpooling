/**
 * CarpoolWork — internal billing engine (Phase 3).
 *
 * Pricing model (decided): bill retrospectively on the number of *active
 * participants of a month* — an employee who recorded at least one carpool
 * that month. Flat 20 CAD / active participant / month. 30-day free trial.
 * Enterprise is a manual tier (custom price / bespoke needs).
 *
 * This module derives every billing figure from CarpoolLog + the company's
 * billing config. Nothing here moves money — it computes what would be
 * invoiced. Stripe wiring comes later and will persist immutable invoices.
 */
import { prisma } from '@/lib/db';

export const BILLING = {
  TRIAL_DAYS: 30,
  DEFAULT_PRICE_CENTS: 2000, // 20.00 CAD / active participant / month
  CURRENCY: 'CAD',
  // Enterprise thresholds (informational — flagged when a company crosses them).
  ENTERPRISE_PARTICIPANTS: 250,
  ENTERPRISE_SITES: 2,
} as const;

export type BillingMonthStatus = 'current' | 'trial' | 'due' | 'paid';

export type BillingMonth = {
  year: number;
  month: number; // 1–12 (the usage month)
  monthStartIso: string;
  activeParticipants: number;
  amountCents: number; // participants × price (the billable value)
  status: BillingMonthStatus;
};

export type BillingOverview = {
  company: { id: string; name: string; tier: 'STANDARD' | 'ENTERPRISE'; pricePerParticipantCents: number };
  currency: string;
  trial: { active: boolean; endsAtIso: string; daysLeft: number };
  // Retrospective invoice that would be issued now, for last completed month.
  nextInvoice: {
    year: number;
    month: number;
    monthStartIso: string;
    activeParticipants: number;
    amountCents: number;
    isTrial: boolean; // covered by the free trial → nothing to pay
  } | null;
  // Live current month (still accumulating) — used to project a run-rate.
  currentMonth: { activeParticipants: number; amountCents: number };
  history: BillingMonth[]; // most recent first, current month included
  enterpriseSuggested: boolean; // crosses an Enterprise threshold
  invoices: BillingInvoice[]; // issued invoices (immutable), most recent first
};

export type BillingInvoice = {
  id: string;
  number: string;
  periodYear: number;
  periodMonth: number;
  amountCents: number;
  status: 'DUE' | 'PAID' | 'VOID' | 'TRIAL';
  issuedAtIso: string;
};

function monthStart(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

async function distinctActiveParticipants(companyId: string, from: Date, to: Date): Promise<number> {
  const rows = await prisma.carpoolLog.groupBy({
    by: ['membershipId'],
    where: { companyId, date: { gte: from, lt: to } },
  });
  return rows.length;
}

export async function getBillingOverview(companyId: string): Promise<BillingOverview | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      trialStartAt: true,
      pricePerParticipantCents: true,
      createdAt: true,
    },
  });
  if (!company) return null;

  const tier: 'STANDARD' | 'ENTERPRISE' = company.subscriptionTier === 'ENTERPRISE' ? 'ENTERPRISE' : 'STANDARD';
  const price = company.pricePerParticipantCents ?? BILLING.DEFAULT_PRICE_CENTS;

  const now = new Date();
  const trialStart = company.trialStartAt ?? company.createdAt;
  const trialEnd = new Date(trialStart.getTime() + BILLING.TRIAL_DAYS * 86400000);
  const trialActive = now < trialEnd;
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));

  // A usage month is covered by the trial when the month begins before the
  // trial ends (trial rounded up to whole months — simple and generous).
  const freeMonth = (ms: Date) => ms < trialEnd;

  // Build the current month + the 5 preceding months.
  const y = now.getFullYear();
  const m0 = now.getMonth();
  const specs: { year: number; month0: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(y, m0 - i, 1);
    specs.push({ year: d.getFullYear(), month0: d.getMonth() });
  }

  const history: BillingMonth[] = await Promise.all(
    specs.map(async ({ year, month0 }) => {
      const from = monthStart(year, month0);
      const to = monthStart(year, month0 + 1);
      const participants = await distinctActiveParticipants(companyId, from, to);
      const isCurrent = year === y && month0 === m0;
      const status: BillingMonthStatus = isCurrent ? 'current' : freeMonth(from) ? 'trial' : 'due';
      return {
        year,
        month: month0 + 1,
        monthStartIso: from.toISOString(),
        activeParticipants: participants,
        amountCents: participants * price,
        status,
      };
    })
  );

  const current = history[0];
  const previous = history[1] ?? null;

  const nextInvoice = previous
    ? {
        year: previous.year,
        month: previous.month,
        monthStartIso: previous.monthStartIso,
        activeParticipants: previous.activeParticipants,
        amountCents: previous.status === 'trial' ? 0 : previous.amountCents,
        isTrial: previous.status === 'trial',
      }
    : null;

  // Enterprise suggestion: current active participants cross the threshold.
  const siteCount = await prisma.companyMembership
    .findMany({
      where: { companyId, status: 'ACTIVE', workSite: { not: null } },
      select: { workSite: true },
      distinct: ['workSite'],
    })
    .then((rows: { workSite: string | null }[]) => rows.length);

  const enterpriseSuggested =
    tier !== 'ENTERPRISE' &&
    (current.activeParticipants >= BILLING.ENTERPRISE_PARTICIPANTS || siteCount > BILLING.ENTERPRISE_SITES);

  // Issued invoices (immutable). Best-effort — table may not exist pre-migration.
  let invoices: BillingInvoice[] = [];
  try {
    const rows = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      select: { id: true, number: true, periodYear: true, periodMonth: true, amountCents: true, status: true, issuedAt: true },
    });
    invoices = rows.map((r: { id: string; number: string; periodYear: number; periodMonth: number; amountCents: number; status: string; issuedAt: Date }) => ({
      id: r.id,
      number: r.number,
      periodYear: r.periodYear,
      periodMonth: r.periodMonth,
      amountCents: r.amountCents,
      status: r.status as BillingInvoice['status'],
      issuedAtIso: r.issuedAt.toISOString(),
    }));
  } catch {
    invoices = [];
  }

  return {
    company: { id: company.id, name: company.name, tier, pricePerParticipantCents: price },
    currency: BILLING.CURRENCY,
    trial: { active: trialActive, endsAtIso: trialEnd.toISOString(), daysLeft },
    nextInvoice,
    currentMonth: { activeParticipants: current.activeParticipants, amountCents: current.amountCents },
    history,
    enterpriseSuggested,
    invoices,
  };
}
