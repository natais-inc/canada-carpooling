-- CarpoolWork — Phase 2 (employee experience) : consent + commute profile.
-- Additive, idempotent. Apply against Neon from the Vercel side.
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "acceptedAt"  TIMESTAMP(3);
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeFsa"     TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeCity"    TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "workSite"    TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "commuteDays" TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "arriveBy"    TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "departAt"    TEXT;
ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "commuteRole" TEXT;
