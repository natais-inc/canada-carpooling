/**
 * CarpoolWork — email verification helpers (Phase 5).
 * Creating a token and sending the email are best-effort: callers wrap in
 * try/catch so account creation never fails if email isn't configured yet.
 */
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail, verificationEmail, appBaseUrl } from '@/lib/email';

const TTL_MS = 48 * 60 * 60 * 1000;

export async function createAndSendVerification(
  userId: string,
  email: string,
  firstName: string,
  lang: 'fr' | 'en'
) {
  await prisma.emailVerifyToken.deleteMany({ where: { userId } });
  const token = randomBytes(24).toString('hex');
  await prisma.emailVerifyToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  const url = `${appBaseUrl()}/${lang}/verifier-courriel/${token}`;
  const tpl = verificationEmail(lang, firstName || (lang === 'en' ? 'there' : ''), url);
  return sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

/** Consume a token: mark the user verified. Idempotent-ish. */
export async function verifyEmailToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const row = await prisma.emailVerifyToken.findUnique({ where: { token }, select: { userId: true, expiresAt: true } });
  if (!row) return { ok: false, error: 'invalid' };
  if (row.expiresAt < new Date()) {
    await prisma.emailVerifyToken.deleteMany({ where: { userId: row.userId } }).catch(() => {});
    return { ok: false, error: 'expired' };
  }
  await prisma.user.update({ where: { id: row.userId }, data: { emailVerified: new Date() } });
  await prisma.emailVerifyToken.deleteMany({ where: { userId: row.userId } }).catch(() => {});
  return { ok: true };
}
