/**
 * CarpoolWork — employer member management API.
 * All operations gate through requireCompanyAdmin(); the company is resolved
 * from the caller's own membership, never from the request. Only MEMBER-role
 * rows can be managed here (admins are out of scope for Phase 1), which also
 * prevents an admin from locking themselves out.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanyAdmin } from '@/lib/company';

export const dynamic = 'force-dynamic';

// Add an existing CarpoolWork user (by email) as an INVITED member.
export async function POST(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const email = String(body?.email || '').trim().toLowerCase();
  const department = String(body?.department || '').trim() || null;
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'no_account' }, { status: 404 });

  const existing = await prisma.companyMembership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: access.companyId } },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== 'REMOVED') {
    return NextResponse.json({ error: 'already_member' }, { status: 409 });
  }

  if (existing) {
    await prisma.companyMembership.update({
      where: { id: existing.id },
      data: { status: 'INVITED', role: 'MEMBER', department },
    });
  } else {
    await prisma.companyMembership.create({
      data: { userId: user.id, companyId: access.companyId, role: 'MEMBER', status: 'INVITED', department },
    });
  }
  return NextResponse.json({ ok: true });
}

// Change a MEMBER membership's status (activate / remove / re-invite).
export async function PATCH(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const membershipId = String(body?.membershipId || '');
  const status = String(body?.status || '');
  if (!membershipId || !['ACTIVE', 'INVITED', 'REMOVED'].includes(status)) {
    return NextResponse.json({ error: 'invalid_args' }, { status: 400 });
  }

  const m = await prisma.companyMembership.findUnique({
    where: { id: membershipId },
    select: { companyId: true, role: true },
  });
  if (!m || m.companyId !== access.companyId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (m.role === 'EMPLOYER_ADMIN') {
    return NextResponse.json({ error: 'cannot_modify_admin' }, { status: 403 });
  }

  await prisma.companyMembership.update({
    where: { id: membershipId },
    data: { status: status as 'ACTIVE' | 'INVITED' | 'REMOVED' },
  });
  return NextResponse.json({ ok: true });
}
