-- CarpoolWork — Phase 1 employer foundation.
-- Idempotent, additive DDL matching the Prisma models Company + CompanyMembership.
-- Apply against Neon from the Vercel side (the build sandbox cannot reach the DB).
-- Safe to run more than once.

DO $$ BEGIN
  CREATE TYPE "MembershipRole" AS ENUM ('MEMBER','EMPLOYER_ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('INVITED','ACTIVE','REMOVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Company" (
  "id"               TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "region"           TEXT,
  "parkingCostYear"  INTEGER NOT NULL DEFAULT 1200,
  "avgCommuteKm"     DOUBLE PRECISION NOT NULL DEFAULT 20,
  "subscriptionTier" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyMembership" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "companyId"  TEXT NOT NULL,
  "role"       "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "status"     "MembershipStatus" NOT NULL DEFAULT 'INVITED',
  "department" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_companyId_key" ON "CompanyMembership"("userId","companyId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_status_idx" ON "CompanyMembership"("companyId","status");
CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId");

-- Foreign keys (added only if missing)
DO $$ BEGIN
  ALTER TABLE "CompanyMembership"
    ADD CONSTRAINT "CompanyMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CompanyMembership"
    ADD CONSTRAINT "CompanyMembership_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
