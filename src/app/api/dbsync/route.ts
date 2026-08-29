import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// TEMPORARY one-off schema sync. Idempotent, additive-only DDL. Remove this route after running once.

// Each User scalar column: [name, sqlType, extra]
const USER_COLUMNS: [string, string, string][] = [
  ['emailVerified', 'TIMESTAMP(3)', ''],
  ['passwordHash', 'TEXT', ''],
  ['phone', 'TEXT', ''],
  ['phoneVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['profileImage', 'TEXT', ''],
  ['bio', 'TEXT', ''],
  ['preferredLanguage', 'TEXT', "NOT NULL DEFAULT 'fr'"],
  ['role', '"UserRole"', "NOT NULL DEFAULT 'USER'"],
  ['idVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['licenseVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['selfieVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['vehicleRegistrationVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['insuranceVerified', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['verificationStatus', 'TEXT', "NOT NULL DEFAULT 'unverified'"],
  ['veriffSessionId', 'TEXT', ''],
  ['verifiedAt', 'TIMESTAMP(3)', ''],
  ['idDocumentUrl', 'TEXT', ''],
  ['licenseDocumentUrl', 'TEXT', ''],
  ['selfieUrl', 'TEXT', ''],
  ['vehicleRegistrationUrl', 'TEXT', ''],
  ['insuranceDocumentUrl', 'TEXT', ''],
  ['stripeCustomerId', 'TEXT', ''],
  ['stripeAccountId', 'TEXT', ''],
  ['averageRating', 'DOUBLE PRECISION', 'NOT NULL DEFAULT 0'],
  ['totalTripsAsDriver', 'INTEGER', 'NOT NULL DEFAULT 0'],
  ['totalTripsAsPassenger', 'INTEGER', 'NOT NULL DEFAULT 0'],
  ['responseRate', 'DOUBLE PRECISION', 'NOT NULL DEFAULT 100'],
  ['cancellationRate', 'DOUBLE PRECISION', 'NOT NULL DEFAULT 0'],
  ['consentAt', 'TIMESTAMP(3)', ''],
  ['consentVersion', 'TEXT', ''],
  ['consentIp', 'TEXT', ''],
  ['privacyPolicyAccepted', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['termsAccepted', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['marketingConsent', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['locationConsent', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['consentWithdrawnAt', 'TIMESTAMP(3)', ''],
  ['dataExportRequestedAt', 'TIMESTAMP(3)', ''],
  ['dataDeletionRequestedAt', 'TIMESTAMP(3)', ''],
  ['isBanned', 'BOOLEAN', 'NOT NULL DEFAULT false'],
  ['banReason', 'TEXT', ''],
  ['isActive', 'BOOLEAN', 'NOT NULL DEFAULT true'],
  ['createdAt', 'TIMESTAMP(3)', 'NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt', 'TIMESTAMP(3)', 'NOT NULL DEFAULT CURRENT_TIMESTAMP'],
];

function buildStatements(): { label: string; sql: string }[] {
  const s: { label: string; sql: string }[] = [];
  s.push({
    label: 'enum UserRole',
    sql: `DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER','ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  });
  for (const [name, type, extra] of USER_COLUMNS) {
    s.push({
      label: `User.${name}`,
      sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${name}" ${type} ${extra}`.trim(),
    });
  }
  s.push({
    label: 'table ConsentLog',
    sql: `CREATE TABLE IF NOT EXISTS "ConsentLog" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "action" TEXT NOT NULL, "consentType" TEXT NOT NULL, "version" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "details" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id"))`,
  });
  s.push({ label: 'idx ConsentLog.userId', sql: `CREATE INDEX IF NOT EXISTS "ConsentLog_userId_idx" ON "ConsentLog"("userId")` });
  s.push({ label: 'idx ConsentLog.action', sql: `CREATE INDEX IF NOT EXISTS "ConsentLog_action_consentType_idx" ON "ConsentLog"("action","consentType")` });
  s.push({
    label: 'table DataProcessingLog',
    sql: `CREATE TABLE IF NOT EXISTS "DataProcessingLog" ("id" TEXT NOT NULL, "userId" TEXT, "activity" TEXT NOT NULL, "dataCategory" TEXT NOT NULL, "purpose" TEXT NOT NULL, "legalBasis" TEXT NOT NULL, "details" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "DataProcessingLog_pkey" PRIMARY KEY ("id"))`,
  });
  s.push({ label: 'idx DataProcessingLog.userId', sql: `CREATE INDEX IF NOT EXISTS "DataProcessingLog_userId_idx" ON "DataProcessingLog"("userId")` });
  s.push({ label: 'idx DataProcessingLog.activity', sql: `CREATE INDEX IF NOT EXISTS "DataProcessingLog_activity_idx" ON "DataProcessingLog"("activity")` });
  return s;
}

export async function GET(_req: NextRequest) {
  const statements = buildStatements();
  const failures: { label: string; error: string }[] = [];
  let okCount = 0;
  for (const st of statements) {
    try {
      await prisma.$executeRawUnsafe(st.sql);
      okCount++;
    } catch (e: any) {
      failures.push({ label: st.label, error: String(e?.message || e).slice(0, 200) });
    }
  }
  let userColumns = -1;
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='User'`
    );
    userColumns = rows?.[0]?.n ?? -1;
  } catch {}

  // One-time: promote the founder account to ADMIN (idempotent)
  let promoted = false;
  try {
    const n = await prisma.$executeRawUnsafe(
      `UPDATE "User" SET role='ADMIN' WHERE email='mpondisimb@gmail.com'`
    );
    promoted = n > 0;
  } catch {}

  return NextResponse.json({ okCount, total: statements.length, userColumns, promoted, failures });
}
