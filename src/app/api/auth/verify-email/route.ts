/**
 * CarpoolWork — consume an email-verification token.
 * Public POST { token }. Triggered by JS on the verification page (so link
 * scanners that don't run JS don't consume the token).
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/verification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const token = String(body?.token || '');
  if (!token) return NextResponse.json({ error: 'invalid_args' }, { status: 400 });

  try {
    const res = await verifyEmailToken(token);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.error === 'expired' ? 410 : 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
