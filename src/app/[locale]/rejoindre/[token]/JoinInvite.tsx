'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Check, Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export type JoinState = 'valid' | 'accepted' | 'expired' | 'revoked' | 'notfound';

export default function JoinInvite({
  locale, token, companyName, email, state, isLoggedIn,
}: {
  locale: string; token: string; companyName: string; email: string; state: JoinState; isLoggedIn: boolean;
}) {
  const t = useTranslations('joinInvite');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = `/${locale}/rejoindre/${token}`;
  const cbq = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  async function accept() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/${locale}/mon-covoiturage`);
        router.refresh();
      } else {
        setError(t('acceptError'));
        setBusy(false);
      }
    } catch {
      setError(t('acceptError'));
      setBusy(false);
    }
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );

  if (state === 'notfound' || state === 'revoked' || state === 'expired') {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('invalidTitle')}</h1>
        <p className="text-gray-600 mt-2">{t(`invalid_${state}` as any)}</p>
        <a href={`/${locale}`} className="inline-block mt-6 text-brand-600 font-medium hover:underline">{t('goHome')}</a>
      </Shell>
    );
  }

  if (state === 'accepted') {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('alreadyTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('alreadyBody', { company: companyName })}</p>
        <a
          href={isLoggedIn ? `/${locale}/mon-covoiturage` : `/${locale}/auth/login${cbq}`}
          className="inline-flex items-center gap-2 mt-6 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700"
        >
          {t('goToMyCarpool')}
        </a>
      </Shell>
    );
  }

  // state === 'valid'
  return (
    <Shell>
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <Building2 className="h-6 w-6 text-brand-600" />
      </div>
      <p className="text-sm text-brand-700 font-medium">{t('eyebrow')}</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">{companyName}</h1>
      <p className="text-gray-600 mt-2">{t('body', { company: companyName })}</p>

      {isLoggedIn ? (
        <div className="mt-6">
          <button
            onClick={accept}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('join', { company: companyName })}
          </button>
          {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-gray-500">{t('authPrompt')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/${locale}/auth/register${cbq}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700"
            >
              <UserPlus className="h-4 w-4" /> {t('createAccount')}
            </a>
            <a
              href={`/${locale}/auth/login${cbq}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 hover:border-brand-500 hover:text-brand-700"
            >
              <LogIn className="h-4 w-4" /> {t('logIn')}
            </a>
          </div>
          {email ? <p className="text-xs text-gray-400 mt-1">{t('inviteFor', { email })}</p> : null}
        </div>
      )}
    </Shell>
  );
}
