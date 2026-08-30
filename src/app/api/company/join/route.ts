/**
 * CarpoolWork — self-join a company via a QR/join code (Phase 4).
 * Auto-approves (ACTIVE) only when the user's email domain matches the
 * company's declared domains AND the email is verified; otherwise the
 * membership is created PENDING for admin approval.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const code = String(body?.code || '');
  if (!code) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  const joinCode = await prisma.companyJoinCode.findUnique({
    where: { code },
    select: { enabled: true, department: true, company: { select: { id: true, name: true, allowedEmailDomains: true } } },
  });
  if (!joinCode || !joinCode.enabled) return NextResponse.json({ error: 'invalid_code' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const domains = String(joinCode.company.allowedEmailDomains || '')
    .split(',')
    .map((d: string) => d.trim().toLowerCase())
    .filter(Boolean);
  const domainMatch = domains.length > 0 && domains.includes(domainOf(user.email));
  const verified = !!user.emailVerified;
  const autoApprove = domainMatch && verified;

  const companyId = joinCode.company.id;
  const existing = await prisma.companyMembership.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { status: true },
  });

  // Don't downgrade an existing active/invited member; report their state.
  if (existing && (existing.status === 'ACTIVE' || existing.status === 'INVITED')) {
    return NextResponse.json({ status: 'active', companyName: joinCode.company.name, already: true });
  }
  if (existing && existing.status === 'PENDING') {
    return NextResponse.json({ status: 'pending', companyName: joinCode.company.name, already: true, domainMatch, verified });
  }

  const status = autoApprove ? 'ACTIVE' : 'PENDING';
  await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId, companyId } },
    update: { status, ...(autoApprove ? { acceptedAt: new Date() } : {}), ...(joinCode.department ? { department: joinCode.department } : {}) },
    create: {
      userId,
      companyId,
      role: 'MEMBER',
      status,
      acceptedAt: autoApprove ? new Date() : null,
      department: joinCode.department,
    },
  });

  return NextResponse.json({
    status: autoApprove ? 'active' : 'pending',
    companyName: joinCode.company.name,
    domainMatch,
    verified,
  });
}
