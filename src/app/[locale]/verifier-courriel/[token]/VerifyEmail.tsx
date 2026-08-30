'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Check, AlertCircle } from 'lucide-react';

type State = 'loading' | 'ok' | 'expired' | 'invalid';

export default function VerifyEmail({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations('verify');
  const [state, setState] = useState<State>('loading');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (res.ok) setState('ok');
        else if (res.status === 410) setState('expired');
        else setState('invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {state === 'loading' ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('loading')}</p>
          </>
        ) : state === 'ok' ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="h-6 w-6 text-green-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900">{t('okTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('okBody')}</p>
            <a href={`/${locale}/mon-covoiturage`} className="inline-block mt-6 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700">{t('continue')}</a>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-6 w-6 text-gray-400" /></div>
            <h1 className="text-2xl font-bold text-gray-900">{t(state === 'expired' ? 'expiredTitle' : 'invalidTitle')}</h1>
            <p className="text-gray-600 mt-2">{t(state === 'expired' ? 'expiredBody' : 'invalidBody')}</p>
            <a href={`/${locale}/mon-covoiturage`} className="inline-block mt-6 text-brand-600 font-medium hover:underline">{t('goHome')}</a>
          </>
        )}
      </div>
    </div>
  );
}
