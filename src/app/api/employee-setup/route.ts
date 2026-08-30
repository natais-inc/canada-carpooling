/**
 * TEMPORARY — Phase 2 migration + test seed. Token-gated.
 * Adds the commute/consent columns to CompanyMembership (idempotent), then
 * creates a second demo company and invites the founder to it, so the
 * accept-invitation flow on /mon-covoiturage can be tested end to end.
 *
 * REMOVE THIS FILE once it has run.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SETUP_TOKEN = 'ef2663e1dbc37c8917c6d6e6806d92df38662e84';
const ADMIN_EMAIL = 'mpondisimb@gmail.com';

const DDL: string[] = [
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "acceptedAt"  TIMESTAMP(3);`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeFsa"     TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeCity"    TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "workSite"    TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "commuteDays" TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "arriveBy"    TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "departAt"    TEXT;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "commuteRole" TEXT;`,
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const log: string[] = [];

  for (const stmt of DDL) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      log.push('DDL ok: ' + stmt.slice(0, 60));
    } catch (e: any) {
      log.push('DDL ERR: ' + stmt.slice(0, 60) + ' -> ' + e.message);
    }
  }

  try {
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
    if (!admin) return NextResponse.json({ ok: false, log, error: 'admin not found' }, { status: 404 });

    const NAME = 'Employeur démo 2 — Whitby';
    let company = await prisma.company.findFirst({ where: { name: NAME }, select: { id: true } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: NAME, region: 'Ontario', parkingCostYear: 1200, avgCommuteKm: 20 },
        select: { id: true },
      });
      log.push('company created: ' + company.id);
    } else {
      log.push('company exists: ' + company.id);
    }

    await prisma.companyMembership.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: {},
      create: { userId: admin.id, companyId: company.id, role: 'MEMBER', status: 'INVITED' },
    });
    log.push('invitation ready for ' + ADMIN_EMAIL);

    return NextResponse.json({ ok: true, log });
  } catch (e: any) {
    return NextResponse.json({ ok: false, log, error: e.message }, { status: 500 });
  }
}
