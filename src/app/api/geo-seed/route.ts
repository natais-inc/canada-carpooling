/**
 * TEMPORARY — Phase 2 brick 3 demo: home coordinates around Oshawa so the
 * within-2km matching is visible. Token-gated. REMOVE once run.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SETUP_TOKEN = '69c96860d1318e7a901e11d4707ef9bd54d1dd46';
const COMPANY = 'Entreprise démo — Durham';
const ADMIN_EMAIL = 'mpondisimb@gmail.com';

// email/index -> [lat, lng]. Founder central; several demos < 2km, some farther.
const FOUNDER: [number, number] = [43.897, -78.863];
const DEMO: Record<number, [number, number]> = {
  1: [43.9005, -78.8585], // ~0.5 km
  2: [43.8935, -78.8700], // ~0.7 km
  3: [43.9150, -78.8450], // ~2.5 km
  4: [43.9050, -78.8560], // ~1.1 km
  5: [43.8800, -78.9400], // ~6 km
  6: [43.8905, -78.8650], // ~0.8 km
  7: [43.9180, -78.8400], // ~3 km
  8: [43.9100, -78.6800], // ~15 km
};

const DDL: string[] = [
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeLat" DOUBLE PRECISION;`,
  `ALTER TABLE "CompanyMembership" ADD COLUMN IF NOT EXISTS "homeLng" DOUBLE PRECISION;`,
  `CREATE TABLE IF NOT EXISTS "CarpoolLog" (
     "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "membershipId" TEXT NOT NULL,
     "partnerName" TEXT, "date" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "CarpoolLog_pkey" PRIMARY KEY ("id"));`,
  `CREATE INDEX IF NOT EXISTS "CarpoolLog_companyId_date_idx" ON "CarpoolLog"("companyId","date");`,
  `CREATE INDEX IF NOT EXISTS "CarpoolLog_membershipId_date_idx" ON "CarpoolLog"("membershipId","date");`,
  `DO $$ BEGIN ALTER TABLE "CarpoolLog" ADD CONSTRAINT "CarpoolLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN ALTER TABLE "CarpoolLog" ADD CONSTRAINT "CarpoolLog_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "CompanyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const log: string[] = [];
  for (const stmt of DDL) {
    try { await prisma.$executeRawUnsafe(stmt); log.push('DDL ok: ' + stmt.slice(0, 46).replace(/\s+/g, ' ')); }
    catch (e: any) { log.push('DDL ERR: ' + stmt.slice(0, 46).replace(/\s+/g, ' ') + ' -> ' + e.message); }
  }

  const company = await prisma.company.findFirst({ where: { name: COMPANY }, select: { id: true } });
  if (!company) return NextResponse.json({ ok: false, log, error: 'company not found' }, { status: 404 });

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (admin) {
    await prisma.companyMembership.updateMany({
      where: { userId: admin.id, companyId: company.id },
      data: { homeLat: FOUNDER[0], homeLng: FOUNDER[1] },
    });
    log.push(`founder @ ${FOUNDER.join(',')}`);
  }

  for (let i = 1; i <= 8; i++) {
    const [lat, lng] = DEMO[i];
    const u = await prisma.user.findUnique({ where: { email: `demo${i}@demo.carpoolwork.ca` }, select: { id: true } });
    if (!u) continue;
    const res = await prisma.companyMembership.updateMany({
      where: { userId: u.id, companyId: company.id },
      data: { homeLat: lat, homeLng: lng },
    });
    if (res.count) log.push(`demo${i} @ ${lat},${lng}`);
  }

  return NextResponse.json({ ok: true, log });
}
