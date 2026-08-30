/**
 * CarpoolWork — company QR join codes (Phase 4).
 * Rotatable, revocable codes posted on-site so employees self-join. Also holds
 * the company's email-domain allowlist for auto-approval. Admin only.
 *   GET   → { allowedEmailDomains, codes: [...] }
 *   POST  { action:'create', department? } | { action:'rotate', id } | { action:'setDomains', domains }
 *   PATCH { id, action:'revoke' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireCompanyAdmin } from '@/lib/company';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function newCode(): string {
  return randomBytes(10).toString('hex'); // 20 hex chars, ~80 bits
}

// Normalise a comma/space separated domain list: lowercase, strip @, dedupe.
function normDomains(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const list = raw
    .split(/[,\s;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@+/, ''))
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
  const uniq = Array.from(new Set(list)).slice(0, 20);
  return uniq.length ? uniq.join(',') : null;
}

export async function GET() {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const [company, codes] = await Promise.all([
      prisma.company.findUnique({ where: { id: access.companyId }, select: { allowedEmailDomains: true } }),
      prisma.companyJoinCode.findMany({
        where: { companyId: access.companyId, enabled: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, department: true, enabled: true, createdAt: true },
      }),
    ]);
    return NextResponse.json({ allowedEmailDomains: company?.allowedEmailDomains || '', codes });
  } catch {
    return NextResponse.json({ allowedEmailDomains: '', codes: [] });
  }
}

export async function POST(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const action = body?.action;

  if (action === 'setDomains') {
    const domains = normDomains(body?.domains);
    await prisma.company.update({ where: { id: access.companyId }, data: { allowedEmailDomains: domains } });
    return NextResponse.json({ ok: true, allowedEmailDomains: domains || '' });
  }

  if (action === 'create') {
    const department = typeof body?.department === 'string' ? body.department.trim().slice(0, 120) || null : null;
    const code = await prisma.companyJoinCode.create({
      data: { companyId: access.companyId, code: newCode(), department, createdByUserId: access.userId },
      select: { id: true, code: true, department: true, enabled: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, code });
  }

  if (action === 'rotate') {
    const id = String(body?.id || '');
    const old = await prisma.companyJoinCode.findFirst({ where: { id, companyId: access.companyId }, select: { department: true } });
    if (!old) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await prisma.companyJoinCode.update({ where: { id }, data: { enabled: false } });
    const code = await prisma.companyJoinCode.create({
      data: { companyId: access.companyId, code: newCode(), department: old.department, createdByUserId: access.userId },
      select: { id: true, code: true, department: true, enabled: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, code });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const id = String(body?.id || '');
  if (!id || body?.action !== 'revoke') return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const c = await prisma.companyJoinCode.findFirst({ where: { id, companyId: access.companyId }, select: { id: true } });
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await prisma.companyJoinCode.update({ where: { id }, data: { enabled: false } });
  return NextResponse.json({ ok: true });
}
