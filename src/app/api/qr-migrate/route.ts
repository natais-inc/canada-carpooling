/**
 * TEMPORARY — Phase 4 QR-join migration (routable).
 * Adds MembershipStatus 'PENDING', Company.allowedEmailDomains, and the
 * CompanyJoinCode table (idempotent, additive). Remove after running once.
 *   GET /api/qr-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = '04f42d08746a7287c74f3d3edd28761548f2c9805dffb8fc';

const STMTS = [
  `ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'PENDING'`,
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "allowedEmailDomains" TEXT`,
  `CREATE TABLE IF NOT EXISTS "CompanyJoinCode" (
     "id" TEXT NOT NULL,
     "companyId" TEXT NOT NULL,
     "code" TEXT NOT NULL,
     "department" TEXT,
     "enabled" BOOLEAN NOT NULL DEFAULT true,
     "createdByUserId" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "CompanyJoinCode_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyJoinCode_code_key" ON "CompanyJoinCode"("code")`,
  `CREATE INDEX IF NOT EXISTS "CompanyJoinCode_companyId_enabled_idx" ON "CompanyJoinCode"("companyId","enabled")`,
  `CREATE INDEX IF NOT EXISTS "CompanyJoinCode_code_idx" ON "CompanyJoinCode"("code")`,
  `DO $$ BEGIN
     ALTER TABLE "CompanyJoinCode" ADD CONSTRAINT "CompanyJoinCode_companyId_fkey"
       FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const log: string[] = [];
  for (const sql of STMTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push('ok: ' + sql.split('\n')[0].trim());
    } catch (e: any) {
      log.push('ERR: ' + sql.split('\n')[0].trim() + ' — ' + (e?.message || String(e)));
    }
  }
  let count: number | null = null;
  try { count = await prisma.companyJoinCode.count(); } catch (e: any) { log.push('count ERR: ' + (e?.message || String(e))); }
  return NextResponse.json({ ok: true, log, joinCodeCount: count });
}
