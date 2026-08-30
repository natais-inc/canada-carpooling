/**
 * CarpoolWork — employer self-serve signup (Phase 4).
 * A logged-in user creates their company workspace and becomes its first
 * EMPLOYER_ADMIN. Starts the 30-day trial. Idempotent guard: a user who already
 * administers a company is not allowed to create another here.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function clean(v: unknown, max: number): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const name = clean(body?.name, 120);
  if (!name || name.length < 2) return NextResponse.json({ error: 'name_required' }, { status: 400 });

  // Guard: user already administers a company.
  const existing = await prisma.companyMembership.findFirst({
    where: { userId, role: 'EMPLOYER_ADMIN', status: 'ACTIVE' },
    select: { companyId: true },
  });
  if (existing) {
    return NextResponse.json({ error: 'already_admin', companyId: existing.companyId }, { status: 409 });
  }

  const region = clean(body?.region, 60);
  const avgCommuteKm = num(body?.avgCommuteKm, 1, 200, 20);
  const parkingCostYear = Math.round(num(body?.parkingCostYear, 0, 100000, 1200));

  const company = await prisma.company.create({
    data: {
      name,
      region,
      avgCommuteKm,
      parkingCostYear,
      trialStartAt: new Date(),
      subscriptionTier: 'STANDARD',
      memberships: {
        create: {
          userId,
          role: 'EMPLOYER_ADMIN',
          status: 'ACTIVE',
          acceptedAt: new Date(),
        },
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ok: true, companyId: company.id, name: company.name });
}
