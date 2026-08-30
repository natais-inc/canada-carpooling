/**
 * CarpoolWork — employer invite links (Phase 4).
 * Create shareable token invitations that work even for people without an
 * account yet. Gated by requireCompanyAdmin; the company comes from membership.
 *   GET   → list pending invites
 *   POST  { email, department? } → create (or return existing) pending invite
 *   PATCH { id, action:'revoke' } → revoke a pending invite
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireCompanyAdmin } from '@/lib/company';
import { prisma } from '@/lib/db';
import { sendEmail, inviteEmail, appBaseUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_DAYS = 30;

export async function GET() {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const invites = await prisma.companyInvite.findMany({
      where: { companyId: access.companyId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, department: true, token: true, createdAt: true, expiresAt: true },
    });
    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ invites: [] });
  }
}

export async function POST(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !EMAIL.test(email)) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  const department = typeof body?.department === 'string' ? body.department.trim().slice(0, 120) || null : null;

  // Already a member of this company?
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const member = await prisma.companyMembership.findFirst({
      where: { userId: existingUser.id, companyId: access.companyId, status: { in: ['INVITED', 'ACTIVE'] } },
      select: { id: true },
    });
    if (member) return NextResponse.json({ error: 'already_member' }, { status: 409 });
  }

  // Reuse an outstanding pending invite for the same email.
  const pending = await prisma.companyInvite.findFirst({
    where: { companyId: access.companyId, email, status: 'PENDING' },
    select: { id: true, email: true, department: true, token: true },
  });
  if (pending) return NextResponse.json({ ok: true, invite: pending, reused: true });

  const token = randomBytes(24).toString('hex');
  const invite = await prisma.companyInvite.create({
    data: {
      companyId: access.companyId,
      email,
      department,
      token,
      invitedByUserId: access.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400000),
    },
    select: { id: true, email: true, department: true, token: true },
  });

  // Email the invitation link (best-effort; no-op if email isn't configured).
  let emailed = false;
  try {
    const company = await prisma.company.findUnique({ where: { id: access.companyId }, select: { name: true } });
    const url = `${appBaseUrl()}/fr/rejoindre/${token}`;
    const tpl = inviteEmail('fr', company?.name || 'CarpoolWork', url);
    const r = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    emailed = !!r.ok;
  } catch {
    emailed = false;
  }

  return NextResponse.json({ ok: true, invite, emailed });
}

export async function PATCH(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const id = String(body?.id || '');
  if (!id || body?.action !== 'revoke') return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  // Only touch invites belonging to the caller's company.
  const inv = await prisma.companyInvite.findFirst({ where: { id, companyId: access.companyId }, select: { id: true } });
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await prisma.companyInvite.update({ where: { id }, data: { status: 'REVOKED' } });
  return NextResponse.json({ ok: true });
}
