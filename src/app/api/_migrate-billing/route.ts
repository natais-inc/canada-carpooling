/**
 * TEMPORARY — Phase 3 billing migration.
 * Adds the additive billing columns to "Company" (idempotent). No data change.
 * Remove this route after running it once in production.
 *
 *   GET /api/_migrate-billing?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = '4f0147a5b9c5033b5762d3781f9ce78a4957aee653a6d51e';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const log: string[] = [];
  const stmts = [
    'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialStartAt" TIMESTAMP(3)',
    'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "pricePerParticipantCents" INTEGER NOT NULL DEFAULT 2000',
  ];
  for (const sql of stmts) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push('ok: ' + sql);
    } catch (e: any) {
      log.push('ERR: ' + sql + ' — ' + (e?.message || String(e)));
    }
  }

  // Sanity read so we confirm the columns are queryable.
  let sample: any = null;
  try {
    sample = await prisma.company.findFirst({
      select: { id: true, name: true, subscriptionTier: true, trialStartAt: true, pricePerParticipantCents: true, createdAt: true },
    });
  } catch (e: any) {
    log.push('read ERR: ' + (e?.message || String(e)));
  }

  return NextResponse.json({ ok: true, log, sample });
}
