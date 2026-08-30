/**
 * CarpoolWork — NATAIS invoicing controls (admin only).
 *   GET   → list all invoices
 *   POST  { action: 'close', year, month } → close a completed usage month
 *   PATCH { id, status } → mark PAID / DUE / VOID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { closeMonth, setInvoiceStatus, listAllInvoices, type InvoiceStatus } from '@/lib/invoicing';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return { ok: false as const, status: 403, error: 'Forbidden — admin only' };
  return { ok: true as const, userId };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const invoices = await listAllInvoices();
    return NextResponse.json({ invoices });
  } catch (e: any) {
    return NextResponse.json({ error: 'list_failed', detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  if (body?.action !== 'close') return NextResponse.json({ error: 'unknown_action' }, { status: 400 });

  const now = new Date();
  // Default target = previous month.
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = Number.isInteger(body?.year) ? body.year : prev.getFullYear();
  const month = Number.isInteger(body?.month) ? body.month : prev.getMonth() + 1;

  const result = await closeMonth(year, month);
  const status = result.ok ? 200 : 400;
  return NextResponse.json(result, { status });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const id = String(body?.id || '');
  const status = String(body?.status || '') as InvoiceStatus;
  if (!id || !['DUE', 'PAID', 'VOID', 'TRIAL'].includes(status)) {
    return NextResponse.json({ error: 'invalid_args' }, { status: 400 });
  }
  const res = await setInvoiceStatus(id, status);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 404 });
  return NextResponse.json({ ok: true, invoice: res.invoice });
}
