/**
 * TEMPORARY — brick 4 demo seeding.
 * Fills recorded carpools for the demo companies so the *measured* impact
 * (employer dashboard + employee view) shows meaningful numbers.
 *
 * Idempotent & non-destructive: only seeds ACTIVE memberships that have ZERO
 * carpools this month, so real logs made during testing are preserved and
 * re-running adds nothing. Remove this route after seeding.
 *
 *   GET /api/_seed-carpools?token=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SEED_TOKEN = 'a3fe694c2d9f928a276cfcf86c59dc88024f045719d7f5ad';

// Deterministic pseudo-random so counts are stable if inspected.
function seeded(n: number): number {
  const x = Math.sin(n * 999) * 10000;
  return x - Math.floor(x);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== SEED_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.getDate();

  const companies = await prisma.company.findMany({
    where: { name: { contains: 'démo', mode: 'insensitive' } },
    select: { id: true, name: true, avgCommuteKm: true },
  });

  const log: any[] = [];
  let created = 0;

  for (const c of companies) {
    const members = await prisma.companyMembership.findMany({
      where: { companyId: c.id, status: 'ACTIVE' },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const existing = await prisma.carpoolLog.count({
        where: { membershipId: m.id, date: { gte: monthStart } },
      });
      if (existing > 0) {
        log.push({ member: `${m.user.firstName} ${m.user.lastName}`, skipped: true, existing });
        continue;
      }

      // 5–16 carpool days this month, on distinct days up to today.
      const target = 5 + Math.floor(seeded(i + 1) * 12);
      const days = new Set<number>();
      let k = 0;
      while (days.size < target && k < 200) {
        const day = 1 + Math.floor(seeded(i * 50 + k + 7) * today);
        const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, today));
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) days.add(d.getTime()); // weekdays only
        k++;
      }

      for (const t of days) {
        await prisma.carpoolLog.create({
          data: { companyId: c.id, membershipId: m.id, date: new Date(t) },
        });
        created++;
      }
      log.push({ member: `${m.user.firstName} ${m.user.lastName}`, added: days.size });
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    companies: companies.map((c: { name: string; avgCommuteKm: number }) => ({ name: c.name, avgCommuteKm: c.avgCommuteKm })),
    log,
  });
}
