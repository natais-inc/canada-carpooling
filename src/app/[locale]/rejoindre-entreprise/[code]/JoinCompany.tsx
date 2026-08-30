'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Check, Loader2, LogIn, UserPlus, AlertCircle, Clock } from 'lucide-react';

export default function JoinCompany({
  locale, code, companyName, department, valid, isLoggedIn,
}: {
  locale: string; code: string; companyName: string; department: string | null; valid: boolean; isLoggedIn: boolean;
}) {
  const t = useTranslations('joinCompany');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'active' | 'pending' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cbq = `?callbackUrl=${encodeURIComponent(`/${locale}/rejoindre-entreprise/${code}`)}`;

  async function join() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/company/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === 'active' || data.status === 'pending')) {
        setResult(data.status);
      } else {
        setError(t('joinError'));
      }
    } catch {
      setError(t('joinError'));
    } finally {
      setBusy(false);
    }
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );

  if (!valid) {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('invalidTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('invalidBody')}</p>
        <a href={`/${locale}`} className="inline-block mt-6 text-brand-600 font-medium hover:underline">{t('goHome')}</a>
      </Shell>
    );
  }

  if (result === 'active') {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="h-6 w-6 text-green-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900">{t('activeTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('activeBody', { company: companyName })}</p>
        <a href={`/${locale}/mon-covoiturage`} className="inline-flex items-center gap-2 mt-6 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700">{t('goToMyCarpool')}</a>
      </Shell>
    );
  }

  if (result === 'pending') {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-4"><Clock className="h-6 w-6 text-orange-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900">{t('pendingTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('pendingBody', { company: companyName })}</p>
        <a href={`/${locale}/mon-covoiturage`} className="inline-block mt-6 text-brand-600 font-medium hover:underline">{t('goToMyCarpool')}</a>
      </Shell>
    );
  }

  // valid, no result yet
  return (
    <Shell>
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4"><Building2 className="h-6 w-6 text-brand-600" /></div>
      <p className="text-sm text-brand-700 font-medium">{t('eyebrow')}</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">{companyName}</h1>
      {department ? <p className="text-sm text-gray-500 mt-1">{t('service', { department })}</p> : null}
      <p className="text-gray-600 mt-2">{t('body', { company: companyName })}</p>

      {isLoggedIn ? (
        <div className="mt-6">
          <button onClick={join} disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-brand-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t('join', { company: companyName })}
          </button>
          {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
          <p className="text-xs text-gray-400 mt-3">{t('securityNote')}</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-gray-500">{t('authPrompt')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`/${locale}/auth/register${cbq}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700"><UserPlus className="h-4 w-4" /> {t('createAccount')}</a>
            <a href={`/${locale}/auth/login${cbq}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 hover:border-brand-500 hover:text-brand-700"><LogIn className="h-4 w-4" /> {t('logIn')}</a>
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('securityNote')}</p>
        </div>
      )}
    </Shell>
  );
}
