/**
 * TEMPORARY — Phase 1 employer provisioning endpoint.
 * Token-gated. Creates the Company/CompanyMembership tables in Neon (idempotent
 * DDL), then seeds a demo company with the founder as EMPLOYER_ADMIN and a few
 * demo employees so the /employer dashboard is populated for testing.
 *
 * REMOVE THIS FILE once provisioning has run.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SETUP_TOKEN = 'e0dc67311ae78c83628aa0639c003bedca8b7ac6c3e1551d';
const ADMIN_EMAIL = 'mpondisimb@gmail.com';
const DEMO_DOMAIN = 'demo.carpoolwork.ca';

// Idempotent DDL — matches prisma/sql/001_employer_foundation.sql.
const DDL: string[] = [
  `DO $$ BEGIN CREATE TYPE "MembershipRole" AS ENUM ('MEMBER','EMPLOYER_ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "MembershipStatus" AS ENUM ('INVITED','ACTIVE','REMOVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "Company" (
     "id" TEXT NOT NULL,
     "name" TEXT NOT NULL,
     "region" TEXT,
     "parkingCostYear" INTEGER NOT NULL DEFAULT 1200,
     "avgCommuteKm" DOUBLE PRECISION NOT NULL DEFAULT 20,
     "subscriptionTier" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
   );`,
  `CREATE TABLE IF NOT EXISTS "CompanyMembership" (
     "id" TEXT NOT NULL,
     "userId" TEXT NOT NULL,
     "companyId" TEXT NOT NULL,
     "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
     "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
     "department" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
   );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_companyId_key" ON "CompanyMembership"("userId","companyId");`,
  `CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_status_idx" ON "CompanyMembership"("companyId","status");`,
  `CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId");`,
  `DO $$ BEGIN ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

const DEMO_EMPLOYEES = [
  { firstName: 'Amélie', lastName: 'Tremblay', department: 'Opérations' },
  { firstName: 'David', lastName: 'Okonkwo', department: 'Opérations' },
  { firstName: 'Sophie', lastName: 'Chen', department: 'Finances' },
  { firstName: 'Marc', lastName: 'Bélanger', department: 'TI' },
  { firstName: 'Priya', lastName: 'Sharma', department: 'RH' },
  { firstName: 'Jean', lastName: 'Roy', department: 'Entrepôt' },
  { firstName: 'Fatima', lastName: 'Haddad', department: 'Entrepôt' },
  { firstName: 'Luc', lastName: 'Gagnon', department: 'Ventes' },
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const log: string[] = [];

  // 1) DDL
  for (const stmt of DDL) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      log.push(`DDL ok: ${stmt.slice(0, 46).replace(/\s+/g, ' ')}…`);
    } catch (e: any) {
      log.push(`DDL ERR: ${stmt.slice(0, 46).replace(/\s+/g, ' ')} -> ${e.message}`);
    }
  }

  try {
    // 2) Founder must exist
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
    if (!admin) {
      return NextResponse.json({ ok: false, log, error: `Admin user ${ADMIN_EMAIL} not found` }, { status: 404 });
    }

    // 3) Demo company (idempotent by name)
    const COMPANY_NAME = 'Entreprise démo — Durham';
    let company = await prisma.company.findFirst({ where: { name: COMPANY_NAME }, select: { id: true } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: COMPANY_NAME, region: 'Ontario', parkingCostYear: 1200, avgCommuteKm: 20 },
        select: { id: true },
      });
      log.push(`company created: ${company.id}`);
    } else {
      log.push(`company exists: ${company.id}`);
    }

    // 4) Founder as EMPLOYER_ADMIN + ACTIVE
    await prisma.companyMembership.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: { role: 'EMPLOYER_ADMIN', status: 'ACTIVE' },
      create: { userId: admin.id, companyId: company.id, role: 'EMPLOYER_ADMIN', status: 'ACTIVE', department: 'Direction' },
    });
    log.push(`admin membership set for ${ADMIN_EMAIL}`);

    // 5) Demo employees (ACTIVE)
    let seeded = 0;
    for (let i = 0; i < DEMO_EMPLOYEES.length; i++) {
      const d = DEMO_EMPLOYEES[i];
      const email = `demo${i + 1}@${DEMO_DOMAIN}`;
      let u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!u) {
        u = await prisma.user.create({
          data: { email, firstName: d.firstName, lastName: d.lastName, preferredLanguage: 'fr', isActive: false },
          select: { id: true },
        });
      }
      await prisma.companyMembership.upsert({
        where: { userId_companyId: { userId: u.id, companyId: company.id } },
        update: { status: 'ACTIVE', department: d.department },
        create: { userId: u.id, companyId: company.id, role: 'MEMBER', status: 'ACTIVE', department: d.department },
      });
      seeded++;
    }
    log.push(`demo employees seeded: ${seeded}`);

    return NextResponse.json({ ok: true, companyId: company.id, log });
  } catch (e: any) {
    return NextResponse.json({ ok: false, log, error: e.message }, { status: 500 });
  }
}
