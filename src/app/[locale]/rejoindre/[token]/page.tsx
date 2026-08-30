import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import JoinInvite, { type JoinState } from './JoinInvite';

export const dynamic = 'force-dynamic';

// Phase 4 — accept a company invite by token. Works for people who don't have
// an account yet: they can sign up / log in and come straight back here.
export default async function JoinPage({ params }: { params: { locale: string; token: string } }) {
  const { locale, token } = params;
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!(session?.user as any)?.id;

  let companyName = '';
  let email = '';
  let state: JoinState = 'notfound';

  try {
    const invite = await prisma.companyInvite.findUnique({
      where: { token },
      include: { company: { select: { name: true } } },
    });
    if (invite) {
      companyName = invite.company.name;
      email = invite.email;
      if (invite.status === 'ACCEPTED') state = 'accepted';
      else if (invite.status === 'REVOKED') state = 'revoked';
      else if (invite.expiresAt < new Date()) state = 'expired';
      else state = 'valid';
    }
  } catch {
    state = 'notfound';
  }

  return (
    <JoinInvite locale={locale} token={token} companyName={companyName} email={email} state={state} isLoggedIn={isLoggedIn} />
  );
}
