/**
 * TEMPORARY — Phase 3 invoicing migration + demo setup (routable).
 *  1) Creates the InvoiceStatus enum + Invoice table (idempotent, additive).
 *  2) Demo realism so closing the previous month yields real invoices:
 *     - backdate "Durham" out of its trial (becomes a paying company),
 *     - backfill previous-month carpools for demo companies (idempotent).
 * Remove this route after running it once in production.
 *   GET /api/invoices-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = '356435e9829288d1836175b555b468506f4153d3e573c336';

const DDL = [
  `DO $$ BEGIN
     CREATE TYPE "InvoiceStatus" AS ENUM ('DUE','PAID','VOID','TRIAL');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "Invoice" (
     "id" TEXT NOT NULL,
     "companyId" TEXT NOT NULL,
     "number" TEXT NOT NULL,
     "periodYear" INTEGER NOT NULL,
     "periodMonth" INTEGER NOT NULL,
     "activeParticipants" INTEGER NOT NULL,
     "pricePerParticipantCents" INTEGER NOT NULL,
     "amountCents" INTEGER NOT NULL,
     "currency" TEXT NOT NULL DEFAULT 'CAD',
     "status" "InvoiceStatus" NOT NULL DEFAULT 'DUE',
     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "paidAt" TIMESTAMP(3),
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
   );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_companyId_periodYear_periodMonth_key" ON "Invoice"("companyId","periodYear","periodMonth");`,
  `CREATE INDEX IF NOT EXISTS "Invoice_companyId_idx" ON "Invoice"("companyId");`,
  `CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");`,
  `DO $$ BEGIN
     ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey"
       FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

function seeded(n: number): number {
  const x = Math.sin(n * 999) * 10000;
  return x - Math.floor(x);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const log: string[] = [];

  // 1) DDL
  for (const sql of DDL) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push('ddl ok: ' + sql.split('\n')[0].trim());
    } catch (e: any) {
      log.push('ddl ERR: ' + sql.split('\n')[0].trim() + ' — ' + (e?.message || String(e)));
    }
  }

  // 2) Make "Durham" a paying company (trial ended ~65 days ago).
  const now = new Date();
  const trialStart = new Date(now.getTime() - 95 * 86400000); // trial ended ~65 days ago
  try {
    const durham = await prisma.company.findFirst({ where: { name: { contains: 'Durham', mode: 'insensitive' } }, select: { id: true } });
    if (durham) {
      await prisma.company.update({ where: { id: durham.id }, data: { trialStartAt: trialStart } });
      log.push('durham trial backdated to ' + trialStart.toISOString().slice(0, 10));
    } else {
      log.push('durham not found');
    }
  } catch (e: any) {
    log.push('backdate ERR: ' + (e?.message || String(e)));
  }

  // 3) Backfill PREVIOUS month carpools for demo companies (idempotent).
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevTo = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

  let created = 0;
  const seedLog: any[] = [];
  const companies = await prisma.company.findMany({
    where: { name: { contains: 'démo', mode: 'insensitive' } },
    select: { id: true, name: true },
  });

  for (const c of companies as { id: string; name: string }[]) {
    const members = await prisma.companyMembership.findMany({
      where: { companyId: c.id, status: 'ACTIVE' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const existing = await prisma.carpoolLog.count({ where: { membershipId: m.id, date: { gte: prevFrom, lt: prevTo } } });
      if (existing > 0) continue;
      const target = 5 + Math.floor(seeded(i + 3) * 12);
      const days = new Set<number>();
      let k = 0;
      while (days.size < target && k < 300) {
        const day = 1 + Math.floor(seeded(i * 40 + k + 11) * daysInPrev);
        const d = new Date(prevFrom.getFullYear(), prevFrom.getMonth(), Math.min(day, daysInPrev));
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) days.add(d.getTime());
        k++;
      }
      for (const t of days) {
        await prisma.carpoolLog.create({ data: { companyId: c.id, membershipId: m.id, date: new Date(t) } });
        created++;
      }
    }
    seedLog.push({ company: c.name, members: members.length });
  }

  let count: number | null = null;
  try {
    count = await prisma.invoice.count();
  } catch (e: any) {
    log.push('count ERR: ' + (e?.message || String(e)));
  }

  return NextResponse.json({ ok: true, log, prevMonthSeeded: created, seedLog, invoiceCount: count });
}
