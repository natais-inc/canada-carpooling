/**
 * TEMPORARY — Phase 3 setup + demo backfill (routable, no leading underscore).
 *
 * 1) Adds the additive billing columns to "Company" (idempotent, no data change).
 * 2) Backfills demo carpools so the *measured* impact and billing figures are
 *    meaningful — only for ACTIVE demo memberships that have ZERO carpools this
 *    month (non-destructive; real test logs are preserved; re-running is a no-op).
 *
 * Remove this route after running it once in production.
 *   GET /api/billing-setup?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = 'd6a2f880f4bbdf4ddc475084d56bab0a3d21975a4de52378';

function seeded(n: number): number {
  const x = Math.sin(n * 999) * 10000;
  return x - Math.floor(x);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const log: string[] = [];

  // 1) Billing columns (idempotent, additive).
  const stmts = [
    'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialStartAt" TIMESTAMP(3)',
    'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "pricePerParticipantCents" INTEGER NOT NULL DEFAULT 2000',
  ];
  for (const sql of stmts) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push('migrate ok: ' + sql);
    } catch (e: any) {
      log.push('migrate ERR: ' + sql + ' — ' + (e?.message || String(e)));
    }
  }

  // 2) Demo carpool backfill.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.getDate();

  let created = 0;
  const seedLog: any[] = [];
  const companies = await prisma.company.findMany({
    where: { name: { contains: 'démo', mode: 'insensitive' } },
    select: { id: true, name: true, avgCommuteKm: true },
  });

  for (const c of companies) {
    const members = await prisma.companyMembership.findMany({
      where: { companyId: c.id, status: 'ACTIVE' },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const existing = await prisma.carpoolLog.count({
        where: { membershipId: m.id, date: { gte: monthStart } },
      });
      if (existing > 0) {
        seedLog.push({ member: `${m.user.firstName} ${m.user.lastName}`, skipped: true, existing });
        continue;
      }
      const target = 5 + Math.floor(seeded(i + 1) * 12);
      const days = new Set<number>();
      let k = 0;
      while (days.size < target && k < 200) {
        const day = 1 + Math.floor(seeded(i * 50 + k + 7) * today);
        const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, today));
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) days.add(d.getTime());
        k++;
      }
      for (const t of days) {
        await prisma.carpoolLog.create({ data: { companyId: c.id, membershipId: m.id, date: new Date(t) } });
        created++;
      }
      seedLog.push({ member: `${m.user.firstName} ${m.user.lastName}`, added: days.size });
    }
  }

  // 3) Sanity read of billing columns.
  let sample: any = null;
  try {
    sample = await prisma.company.findFirst({
      where: { name: { contains: 'démo', mode: 'insensitive' } },
      select: { id: true, name: true, subscriptionTier: true, trialStartAt: true, pricePerParticipantCents: true, createdAt: true },
    });
  } catch (e: any) {
    log.push('read ERR: ' + (e?.message || String(e)));
  }

  return NextResponse.json({
    ok: true,
    migrate: log,
    seedCreated: created,
    companies: companies.map((c: { name: string; avgCommuteKm: number }) => ({ name: c.name, avgCommuteKm: c.avgCommuteKm })),
    seedLog,
    sample,
  });
}
