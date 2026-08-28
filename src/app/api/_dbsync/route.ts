import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// TEMPORARY one-off schema sync. Token-gated. Remove this route after running once.
const TOKEN = 'aBp8PiDcFuOXc7iKXO5KhKYtr0iHq2pM';

const STATEMENTS: string[] = [
  // Ensure the UserRole enum exists
  `DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER','ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  // Add every scalar User column that may be missing (idempotent, additive)
  `ALTER TABLE "User"
     ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
     ADD COLUMN IF NOT EXISTS "phone" TEXT,
     ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "profileImage" TEXT,
     ADD COLUMN IF NOT EXISTS "bio" TEXT,
     ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'fr',
     ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER',
     ADD COLUMN IF NOT EXISTS "idVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "selfieVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "vehicleRegistrationVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
     ADD COLUMN IF NOT EXISTS "veriffSessionId" TEXT,
     ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT,
     ADD COLUMN IF NOT EXISTS "licenseDocumentUrl" TEXT,
     ADD COLUMN IF NOT EXISTS "selfieUrl" TEXT,
     ADD COLUMN IF NOT EXISTS "vehicleRegistrationUrl" TEXT,
     ADD COLUMN IF NOT EXISTS "insuranceDocumentUrl" TEXT,
     ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
     ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
     ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "totalTripsAsDriver" INTEGER NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "totalTripsAsPassenger" INTEGER NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
     ADD COLUMN IF NOT EXISTS "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "consentAt" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "consentVersion" TEXT,
     ADD COLUMN IF NOT EXISTS "consentIp" TEXT,
     ADD COLUMN IF NOT EXISTS "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "locationConsent" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "consentWithdrawnAt" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "dataExportRequestedAt" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "dataDeletionRequestedAt" TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "banReason" TEXT,
     ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
     ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  // Consent audit tables the registration flow writes to
  `CREATE TABLE IF NOT EXISTS "ConsentLog" (
     "id" TEXT NOT NULL,
     "userId" TEXT NOT NULL,
     "action" TEXT NOT NULL,
     "consentType" TEXT NOT NULL,
     "version" TEXT,
     "ipAddress" TEXT,
     "userAgent" TEXT,
     "details" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "ConsentLog_userId_idx" ON "ConsentLog"("userId")`,
  `CREATE INDEX IF NOT EXISTS "ConsentLog_action_consentType_idx" ON "ConsentLog"("action","consentType")`,
  `CREATE TABLE IF NOT EXISTS "DataProcessingLog" (
     "id" TEXT NOT NULL,
     "userId" TEXT,
     "activity" TEXT NOT NULL,
     "dataCategory" TEXT NOT NULL,
     "purpose" TEXT NOT NULL,
     "legalBasis" TEXT NOT NULL,
     "details" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "DataProcessingLog_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "DataProcessingLog_userId_idx" ON "DataProcessingLog"("userId")`,
  `CREATE INDEX IF NOT EXISTS "DataProcessingLog_activity_idx" ON "DataProcessingLog"("activity")`,
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const results: { i: number; ok: boolean; error?: string }[] = [];
  for (let i = 0; i < STATEMENTS.length; i++) {
    try {
      await prisma.$executeRawUnsafe(STATEMENTS[i]);
      results.push({ i, ok: true });
    } catch (e: any) {
      results.push({ i, ok: false, error: String(e?.message || e).slice(0, 300) });
    }
  }
  // Report the resulting User column count so we can confirm success
  let userColumns = -1;
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='User'`
    );
    userColumns = rows?.[0]?.n ?? -1;
  } catch {}
  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ allOk, userColumns, results });
}
