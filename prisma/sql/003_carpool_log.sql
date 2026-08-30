-- CarpoolWork — Phase 2 brick 3: recorded carpools + home coordinates.
-- Additive, idempotent. Apply against Neon from the Vercel side.

ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeLat" DOUBLE PRECISION;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeLng" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "CarpoolLog" (
  "id"           TEXT NOT NULL,
  "companyId"    TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "partnerName"  TEXT,
  "date"         TIMESTAMP(3) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarpoolLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CarpoolLog_companyId_date_idx" ON "CarpoolLog"("companyId","date");
CREATE INDEX IF NOT EXISTS "CarpoolLog_membershipId_date_idx" ON "CarpoolLog"("membershipId","date");

DO $$ BEGIN
  ALTER TABLE "CarpoolLog" ADD CONSTRAINT "CarpoolLog_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CarpoolLog" ADD CONSTRAINT "CarpoolLog_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "CompanyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
