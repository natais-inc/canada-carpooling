/**
 * TEMPORARY — Phase 4 invite migration (routable).
 * Creates InviteStatus enum + CompanyInvite table (idempotent, additive).
 * Remove after running once in production.
 *   GET /api/invites-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = '3f246b3d9ccbc272c38e941ac92766a41072aa0e18588127';

const STMTS = [
  `DO $$ BEGIN
     CREATE TYPE "InviteStatus" AS ENUM ('PENDING','ACCEPTED','REVOKED');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "CompanyInvite" (
     "id" TEXT NOT NULL,
     "companyId" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     "token" TEXT NOT NULL,
     "department" TEXT,
     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
     "invitedByUserId" TEXT,
     "acceptedByUserId" TEXT,
     "acceptedAt" TIMESTAMP(3),
     "expiresAt" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "CompanyInvite_pkey" PRIMARY KEY ("id")
   );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInvite_token_key" ON "CompanyInvite"("token");`,
  `CREATE INDEX IF NOT EXISTS "CompanyInvite_companyId_status_idx" ON "CompanyInvite"("companyId","status");`,
  `CREATE INDEX IF NOT EXISTS "CompanyInvite_token_idx" ON "CompanyInvite"("token");`,
  `DO $$ BEGIN
     ALTER TABLE "CompanyInvite" ADD CONSTRAINT "CompanyInvite_companyId_fkey"
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
  try { count = await prisma.companyInvite.count(); } catch (e: any) { log.push('count ERR: ' + (e?.message || String(e))); }
  return NextResponse.json({ ok: true, log, inviteCount: count });
}
