/**
 * TEMPORARY — Phase 5 email migration (routable).
 * Creates the EmailVerifyToken table (idempotent, additive). Remove after run.
 *   GET /api/email-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = '6d9185cefd3766203d6ca1fb94cf707794ceaeea90b1a4d2';

const STMTS = [
  `CREATE TABLE IF NOT EXISTS "EmailVerifyToken" (
     "id" TEXT NOT NULL,
     "userId" TEXT NOT NULL,
     "token" TEXT NOT NULL,
     "expiresAt" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "EmailVerifyToken_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerifyToken_token_key" ON "EmailVerifyToken"("token")`,
  `CREATE INDEX IF NOT EXISTS "EmailVerifyToken_userId_idx" ON "EmailVerifyToken"("userId")`,
  `DO $$ BEGIN
     ALTER TABLE "EmailVerifyToken" ADD CONSTRAINT "EmailVerifyToken_userId_fkey"
       FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const log: string[] = [];
  for (const sql of STMTS) {
    try { await prisma.$executeRawUnsafe(sql); log.push('ok: ' + sql.split('\n')[0].trim()); }
    catch (e: any) { log.push('ERR: ' + sql.split('\n')[0].trim() + ' — ' + (e?.message || String(e))); }
  }
  let count: number | null = null;
  try { count = await prisma.emailVerifyToken.count(); } catch (e: any) { log.push('count ERR: ' + (e?.message || String(e))); }
  return NextResponse.json({ ok: true, log, tokenCount: count });
}
