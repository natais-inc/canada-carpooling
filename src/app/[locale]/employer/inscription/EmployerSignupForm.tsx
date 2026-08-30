'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function EmployerSignupForm({ locale }: { locale: string }) {
  const t = useTranslations('employerSignup');
  const router = useRouter();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [avgKm, setAvgKm] = useState('20');
  const [parking, setParking] = useState('1200');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/employer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          region: region.trim(),
          avgCommuteKm: parseFloat(avgKm) || 20,
          parkingCostYear: parseFloat(parking) || 1200,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || data?.error === 'already_admin') {
        router.push(`/${locale}/employer`);
        router.refresh();
      } else {
        setError(data?.error === 'name_required' ? t('errName') : t('errGeneric'));
        setBusy(false);
      }
    } catch {
      setError(t('errGeneric'));
      setBusy(false);
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white';
  const label = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
        <Building2 className="h-6 w-6 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="text-gray-600 mt-1 mb-2">{t('subtitle')}</p>
      <div className="inline-flex items-center gap-1.5 text-sm text-brand-700 bg-brand-50 rounded-full px-3 py-1 mb-6">
        <Sparkles className="h-4 w-4" /> {t('trialBadge')}
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className={label}>{t('companyName')}</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('companyNamePh')} autoFocus />
        </div>
        <div>
          <label className={label}>{t('region')}</label>
          <input className={field} value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('regionPh')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{t('avgKm')}</label>
            <input type="number" min={1} max={200} className={field} value={avgKm} onChange={(e) => setAvgKm(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">{t('avgKmHint')}</p>
          </div>
          <div>
            <label className={label}>{t('parking')}</label>
            <input type="number" min={0} max={100000} className={field} value={parking} onChange={(e) => setParking(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">{t('parkingHint')}</p>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {t('submit')}
        </button>
        <p className="text-xs text-gray-400">{t('note')}</p>
      </form>
    </div>
  );
}
