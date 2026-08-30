/**
 * CarpoolWork — weekly engagement reminder (Vercel Cron).
 * Emails active members who declared a commute but haven't logged a carpool in
 * 7+ days. Best-effort; no-op if email isn't configured. Auth via CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, nudgeEmail, appBaseUrl, emailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

const MAX_PER_RUN = 500;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'email_not_configured', sent: 0 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  // Active members who have set up a commute.
  const members = await prisma.companyMembership.findMany({
    where: { status: 'ACTIVE', commuteDays: { not: null } },
    select: { id: true, user: { select: { id: true, email: true, firstName: true, preferredLanguage: true } } },
    take: 5000,
  });

  const seenUsers = new Set<string>();
  let sent = 0;
  let candidates = 0;

  for (const m of members) {
    if (sent >= MAX_PER_RUN) break;
    if (seenUsers.has(m.user.id)) continue;

    const last = await prisma.carpoolLog.findFirst({
      where: { membershipId: m.id },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    const stale = !last || last.date < sevenDaysAgo;
    if (!stale) continue;

    candidates += 1;
    seenUsers.add(m.user.id);

    const lang = m.user.preferredLanguage === 'en' ? 'en' : 'fr';
    const url = `${appBaseUrl()}/${lang}/mon-covoiturage`;
    const tpl = nudgeEmail(lang, m.user.firstName || (lang === 'en' ? 'there' : ''), url);
    const r = await sendEmail({ to: m.user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    if (r.ok) sent += 1;
  }

  return NextResponse.json({ ok: true, candidates, sent });
}
