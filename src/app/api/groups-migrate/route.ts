/**
 * TEMP migration endpoint — carpool groups + auto-validation columns.
 * Idempotent, token-gated. Remove after running in production.
 *   GET /api/groups-migrate?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOKEN = 'cw-migrate-groups-7Kx9mB';

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

  // 1) New CarpoolLog columns for group attribution + rotation.
  await run('carpoollog columns', `ALTER TABLE "CarpoolLog" ADD COLUMN IF NOT EXISTS "groupId" TEXT, ADD COLUMN IF NOT EXISTS "driverMembershipId" TEXT;`);

  // 2) Enum (idempotent).
  await run('enum GroupMemberStatus', `DO $$ BEGIN CREATE TYPE "GroupMemberStatus" AS ENUM ('INVITED','ACTIVE','DECLINED','REMOVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);

  // 3) CarpoolGroup table.
  await run('table CarpoolGroup', `CREATE TABLE IF NOT EXISTS "CarpoolGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarpoolGroup_pkey" PRIMARY KEY ("id")
  );`);
  await run('index CarpoolGroup company', `CREATE INDEX IF NOT EXISTS "CarpoolGroup_companyId_idx" ON "CarpoolGroup"("companyId");`);
  await run('fk CarpoolGroup company', `ALTER TABLE "CarpoolGroup" ADD CONSTRAINT "CarpoolGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);

  // 4) CarpoolGroupMember table.
  await run('table CarpoolGroupMember', `CREATE TABLE IF NOT EXISTS "CarpoolGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarpoolGroupMember_pkey" PRIMARY KEY ("id")
  );`);
  await run('unique CarpoolGroupMember', `CREATE UNIQUE INDEX IF NOT EXISTS "CarpoolGroupMember_groupId_membershipId_key" ON "CarpoolGroupMember"("groupId","membershipId");`);
  await run('index CarpoolGroupMember membership', `CREATE INDEX IF NOT EXISTS "CarpoolGroupMember_membershipId_idx" ON "CarpoolGroupMember"("membershipId");`);
  await run('fk CarpoolGroupMember group', `ALTER TABLE "CarpoolGroupMember" ADD CONSTRAINT "CarpoolGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CarpoolGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  await run('fk CarpoolGroupMember membership', `ALTER TABLE "CarpoolGroupMember" ADD CONSTRAINT "CarpoolGroupMember_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "CompanyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);

  // FK duplicate errors are expected on re-run; treat them as success.
  const okSteps = steps.map((s) => ({ ...s, ok: s.ok || /already exists|duplicate/i.test(s.info || '') }));
  const ok = okSteps.every((s) => s.ok);
  return NextResponse.json({ ok, steps: okSteps });
}
