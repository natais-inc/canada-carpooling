/**
 * TEMPORARY — Phase 2 brick 2 demo seed. Token-gated.
 * Gives the 8 demo employees of "Entreprise démo — Durham" a commute profile
 * so the matching list on /mon-covoiturage shows realistic results.
 * REMOVE THIS FILE once it has run.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SETUP_TOKEN = '0d34d3b6978d0552a8fd48600cfbda086c71fdc2';
const COMPANY = 'Entreprise démo — Durham';

// index → commute profile (varied; several share L1G / weekday mornings)
const PROFILES: Record<number, { fsa: string; city: string; days: string; arrive: string; role: string }> = {
  1: { fsa: 'L1G', city: 'Oshawa', days: '1,2,3,4,5', arrive: '07:45', role: 'passenger' },
  2: { fsa: 'L1G', city: 'Oshawa', days: '1,2,3', arrive: '08:00', role: 'either' },
  3: { fsa: 'L1H', city: 'Oshawa', days: '1,2,3,4,5', arrive: '07:30', role: 'passenger' },
  4: { fsa: 'L1G', city: 'Oshawa', days: '4,5', arrive: '07:45', role: 'driver' },
  5: { fsa: 'L1J', city: 'Whitby', days: '1,2,3,4,5', arrive: '09:00', role: 'passenger' },
  6: { fsa: 'L1G', city: 'Oshawa', days: '2,3,4', arrive: '07:50', role: 'passenger' },
  7: { fsa: 'L1H', city: 'Oshawa', days: '1,2,3,4,5', arrive: '07:40', role: 'either' },
  8: { fsa: 'L1K', city: 'Bowmanville', days: '1,5', arrive: '08:15', role: 'driver' },
};

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const company = await prisma.company.findFirst({ where: { name: COMPANY }, select: { id: true } });
  if (!company) return NextResponse.json({ ok: false, error: 'demo company not found' }, { status: 404 });

  const log: string[] = [];
  let updated = 0;
  for (let i = 1; i <= 8; i++) {
    const email = `demo${i}@demo.carpoolwork.ca`;
    const p = PROFILES[i];
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) { log.push(`skip ${email} (no user)`); continue; }
    const res = await prisma.companyMembership.updateMany({
      where: { userId: user.id, companyId: company.id },
      data: { homeFsa: p.fsa, homeCity: p.city, commuteDays: p.days, arriveBy: p.arrive, commuteRole: p.role },
    });
    if (res.count > 0) { updated += res.count; log.push(`${email}: ${p.fsa} ${p.days} ${p.arrive} ${p.role}`); }
    else log.push(`skip ${email} (no membership)`);
  }

  return NextResponse.json({ ok: true, updated, log });
}
