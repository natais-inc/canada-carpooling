/**
 * CarpoolWork — resend the email-verification link to the logged-in user.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAndSendVerification } from '@/lib/verification';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, emailVerified: true, preferredLanguage: true },
  });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, already: true });

  const lang = user.preferredLanguage === 'en' ? 'en' : 'fr';
  try {
    const r = await createAndSendVerification(userId, user.email, user.firstName, lang);
    return NextResponse.json({ ok: true, skipped: r.skipped || false });
  } catch {
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}
