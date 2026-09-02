/**
 * CarpoolWork — manual invoicing (Phase 3).
 * Closing a completed usage month freezes each company's active-participant
 * count into an immutable Invoice. Retrospective model: 20 CAD / active
 * participant / month, trial months recorded as TRIAL ($0). Payment is tracked
 * manually (mark paid / void) until Stripe automates it.
 */
import { prisma } from '@/lib/db';
import { BILLING, billableCents, siteCountsByCompany } from '@/lib/billing';

export type InvoiceStatus = 'DUE' | 'PAID' | 'VOID' | 'TRIAL';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function invoiceNumber(year: number, month: number, companyId: string): string {
  return `CW-${year}${pad2(month)}-${companyId.slice(-6)}`;
}

async function distinctParticipants(companyId: string, from: Date, to: Date): Promise<number> {
  const rows = await prisma.carpoolLog.groupBy({
    by: ['membershipId'],
    where: { companyId, date: { gte: from, lt: to } },
  });
  return rows.length;
}

export type CloseResult = {
  ok: boolean;
  error?: string;
  year: number;
  month: number;
  created: number;
  skipped: number;
  details: { company: string; status: InvoiceStatus | 'exists' | 'no-activity'; participants: number; amountCents: number }[];
};

/**
 * Close a *completed* usage month: create one immutable invoice per company
 * that had activity. Existing invoices for that period are left untouched.
 */
export async function closeMonth(year: number, month: number): Promise<CloseResult> {
  const now = new Date();
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const base: CloseResult = { ok: true, year, month, created: 0, skipped: 0, details: [] };

  if (isNaN(from.getTime()) || month < 1 || month > 12) {
    return { ...base, ok: false, error: 'invalid_period' };
  }
  if (from >= currentMonthStart) {
    // Only completed months can be invoiced (retrospective billing).
    return { ...base, ok: false, error: 'month_not_complete' };
  }

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, subscriptionTier: true, trialStartAt: true, pricePerParticipantCents: true, monthlyFloorCents: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const siteMap = await siteCountsByCompany();

  for (const c of companies as {
    id: string; name: string; subscriptionTier: string | null;
    trialStartAt: Date | null; pricePerParticipantCents: number | null; monthlyFloorCents: number | null; createdAt: Date;
  }[]) {
    const existing = await prisma.invoice.findUnique({
      where: { companyId_periodYear_periodMonth: { companyId: c.id, periodYear: year, periodMonth: month } },
    });
    if (existing) {
      base.skipped += 1;
      base.details.push({ company: c.name, status: 'exists', participants: existing.activeParticipants, amountCents: existing.amountCents });
      continue;
    }

    const participants = await distinctParticipants(c.id, from, to);
    if (participants === 0) {
      base.details.push({ company: c.name, status: 'no-activity', participants: 0, amountCents: 0 });
      continue; // nothing to bill
    }

    const price = c.pricePerParticipantCents ?? BILLING.DEFAULT_PRICE_CENTS;
    const floor = c.monthlyFloorCents ?? BILLING.DEFAULT_FLOOR_CENTS;
    const sites = siteMap.get(c.id) ?? 1;
    const trialStart = c.trialStartAt ?? c.createdAt;
    const trialEnd = new Date(trialStart.getTime() + BILLING.TRIAL_DAYS * 86400000);
    const isTrial = from < trialEnd;
    const amountCents = billableCents(participants, price, floor, sites, isTrial);
    const status: InvoiceStatus = isTrial ? 'TRIAL' : 'DUE';

    await prisma.invoice.create({
      data: {
        companyId: c.id,
        number: invoiceNumber(year, month, c.id),
        periodYear: year,
        periodMonth: month,
        activeParticipants: participants,
        pricePerParticipantCents: price,
        amountCents,
        currency: BILLING.CURRENCY,
        status,
      },
    });
    base.created += 1;
    base.details.push({ company: c.name, status, participants, amountCents });
  }

  return base;
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return { ok: false as const, error: 'not_found' };
  const paidAt = status === 'PAID' ? new Date() : null;
  const updated = await prisma.invoice.update({ where: { id }, data: { status, paidAt } });
  return { ok: true as const, invoice: updated };
}

export async function listAllInvoices() {
  return prisma.invoice.findMany({
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { issuedAt: 'desc' }],
    include: { company: { select: { name: true } } },
  });
}

export async function listCompanyInvoices(companyId: string) {
  return prisma.invoice.findMany({
    where: { companyId },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });
}

export async function getInvoiceWithCompany(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { company: { select: { id: true, name: true, region: true } } },
  });
}
