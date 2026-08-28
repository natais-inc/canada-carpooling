'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Building2, Leaf, ParkingCircle, Clock3, CheckCircle2, Loader2,
} from 'lucide-react';

function Benefit({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

export default function EmployersPage() {
  const t = useTranslations('employers');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    employees: '',
    message: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/employers/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Building2 className="h-4 w-4" />
            {t('badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-3 gap-6">
          <Benefit icon={ParkingCircle} title={t('benefit1Title')} text={t('benefit1Text')} />
          <Benefit icon={Leaf} title={t('benefit2Title')} text={t('benefit2Text')} />
          <Benefit icon={Clock3} title={t('benefit3Title')} text={t('benefit3Text')} />
        </div>
      </section>

      {/* Pilot + form */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('pilotTitle')}</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{t('pilotText')}</p>
            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  {t(`pilotPoint${i}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {status === 'sent' ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('successTitle')}</h3>
                <p className="text-sm text-gray-600">{t('successText')}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('formTitle')}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formName')} *</label>
                  <input required minLength={2} maxLength={100} className={inputCls} value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formOrganization')} *</label>
                  <input required minLength={2} maxLength={150} className={inputCls} value={form.organization} onChange={set('organization')} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('formEmail')} *</label>
                    <input required type="email" maxLength={200} className={inputCls} value={form.email} onChange={set('email')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('formPhone')}</label>
                    <input type="tel" maxLength={30} className={inputCls} value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formEmployees')}</label>
                  <select className={inputCls} value={form.employees} onChange={set('employees')}>
                    <option value="">—</option>
                    <option value="1-50">1-50</option>
                    <option value="51-250">51-250</option>
                    <option value="251-1000">251-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('formMessage')}</label>
                  <textarea rows={3} maxLength={2000} className={inputCls} value={form.message} onChange={set('message')} />
                </div>
                {status === 'error' && (
                  <p className="text-sm text-red-600">{t('errorText')}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('formSubmit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
