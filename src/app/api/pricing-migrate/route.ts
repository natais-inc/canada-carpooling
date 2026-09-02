/**
 * TEMP migration endpoint — pricing update (25 CAD + 500 CAD/site floor).
 * Idempotent, token-gated. Remove after running in production.
 *   GET /api/pricing-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = 'cw-migrate-pricing-7Kx9mB';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const steps: { step: string; ok: boolean; info?: string }[] = [];
  async function run(step: string, sql: string) {
    try {
      const n = await prisma.$executeRawUnsafe(sql);
      steps.push({ step, ok: true, info: `rows: ${n}` });
    } catch (e: unknown) {
      steps.push({ step, ok: false, info: e instanceof Error ? e.message : String(e) });
    }
  }

  // 1) Add the per-site monthly floor column (default 500.00 CAD).
  await run('add monthlyFloorCents', `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "monthlyFloorCents" INTEGER NOT NULL DEFAULT 50000;`);
  // 2) New default price for future companies: 25.00 CAD.
  await run('set price default 2500', `ALTER TABLE "Company" ALTER COLUMN "pricePerParticipantCents" SET DEFAULT 2500;`);
  // 3) Bump existing companies still on the old 20.00 default to 25.00.
  await run('bump existing 2000 -> 2500', `UPDATE "Company" SET "pricePerParticipantCents" = 2500 WHERE "pricePerParticipantCents" = 2000;`);

  // Snapshot for confirmation.
  let companies: unknown = null;
  try {
    companies = await prisma.$queryRawUnsafe(
      `SELECT "name", "pricePerParticipantCents", "monthlyFloorCents" FROM "Company" ORDER BY "createdAt" ASC;`
    );
  } catch (e: unknown) {
    companies = { error: e instanceof Error ? e.message : String(e) };
  }

  const ok = steps.every((s) => s.ok);
  return NextResponse.json({ ok, steps, companies });
}
