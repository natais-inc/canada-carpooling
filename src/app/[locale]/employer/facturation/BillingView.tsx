'use client';

import { useTranslations } from 'next-intl';
import {
  Receipt, Building2, Sparkles, TrendingUp, Info, ArrowLeft, Crown, FileDown,
} from 'lucide-react';
import type { BillingOverview, BillingMonthStatus, BillingInvoice } from '@/lib/billing';

function useFmt(locale: string) {
  const loc = locale === 'en' ? 'en-CA' : 'fr-CA';
  return {
    int: (n: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(Math.round(n)),
    money: (cents: number) =>
      new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(cents / 100),
    money0: (cents: number) =>
      new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(cents / 100),
    month: (iso: string) => {
      try {
        return new Date(iso).toLocaleDateString(loc, { month: 'long', year: 'numeric' });
      } catch {
        return iso;
      }
    },
    date: (iso: string) => {
      try {
        return new Date(iso).toLocaleDateString(loc, { dateStyle: 'medium' });
      } catch {
        return iso;
      }
    },
  };
}

const statusStyles: Record<BillingMonthStatus, string> = {
  current: 'bg-brand-50 text-brand-700',
  trial: 'bg-amber-100 text-amber-700',
  due: 'bg-gray-100 text-gray-700',
  paid: 'bg-green-100 text-green-700',
};

export default function BillingView({ data, locale }: { data: BillingOverview; locale: string }) {
  const t = useTranslations('billing');
  const fmt = useFmt(locale);
  const { company, trial, nextInvoice, currentMonth, history, enterpriseSuggested, invoices } = data;
  const invStatusStyle: Record<BillingInvoice['status'], string> = {
    DUE: 'bg-brand-50 text-brand-700',
    PAID: 'bg-green-100 text-green-700',
    VOID: 'bg-gray-100 text-gray-500',
    TRIAL: 'bg-amber-100 text-amber-700',
  };
  const periodIso = (y: number, m: number) => new Date(y, m - 1, 1).toISOString();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <a href={`/${locale}/employer`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('backToDashboard')}
      </a>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <Receipt className="h-6 w-6 text-brand-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-0.5 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> {company.name}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                company.tier === 'ENTERPRISE' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {company.tier === 'ENTERPRISE' ? <Crown className="h-3 w-3" /> : null}
              {t(`tier_${company.tier}` as any)}
            </span>
          </p>
        </div>
      </div>

      {/* Trial banner */}
      {trial.active ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">{t('trialActive', { days: trial.daysLeft })}</p>
            <p className="text-sm text-amber-800 mt-0.5">{t('trialUntil', { date: fmt.date(trial.endsAtIso) })}</p>
          </div>
        </div>
      ) : null}

      {/* Next invoice + run-rate */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-brand-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('nextInvoiceTitle')}</h2>
          </div>
          {nextInvoice ? (
            <>
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {nextInvoice.isTrial ? t('freeTrialAmount') : fmt.money(nextInvoice.amountCents)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t('nextInvoiceDetail', {
                  month: fmt.month(nextInvoice.monthStartIso),
                  count: nextInvoice.activeParticipants,
                })}
              </p>
              {nextInvoice.isTrial ? (
                <p className="text-xs text-amber-700 mt-1">{t('coveredByTrial')}</p>
              ) : null}
            </>
          ) : (
            <p className="text-gray-500 text-sm">{t('noInvoiceYet')}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('runRateTitle')}</h2>
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">{fmt.money0(currentMonth.amountCents)}</div>
          <p className="text-sm text-gray-600 mt-1">
            {t('runRateDetail', { count: currentMonth.activeParticipants, price: fmt.money0(company.pricePerParticipantCents) })}
          </p>
        </div>
      </div>

      {/* Enterprise suggestion */}
      {enterpriseSuggested ? (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 flex items-start gap-3">
          <Crown className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700">{t('enterpriseSuggested')}</p>
        </div>
      ) : null}

      {/* History */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{t('historyTitle')}</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-medium">{t('colMonth')}</th>
                <th className="px-4 py-3 font-medium">{t('colParticipants')}</th>
                <th className="px-4 py-3 font-medium">{t('colAmount')}</th>
                <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={`${h.year}-${h.month}`} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap capitalize">{fmt.month(h.monthStartIso)}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{fmt.int(h.activeParticipants)}</td>
                  <td className="px-4 py-3 text-gray-900 tabular-nums">
                    {h.status === 'trial' ? <span className="text-gray-400">{fmt.money(h.amountCents)}</span> : fmt.money(h.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[h.status]}`}>
                      {t(`status_${h.status}` as any)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issued invoices */}
      {invoices.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{t('invoicesTitle')}</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="px-4 py-3 font-medium">{t('invColNumber')}</th>
                    <th className="px-4 py-3 font-medium">{t('colMonth')}</th>
                    <th className="px-4 py-3 font-medium">{t('colAmount')}</th>
                    <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('invColDownload')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((iv) => (
                    <tr key={iv.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{iv.number}</td>
                      <td className="px-4 py-3 text-gray-900 whitespace-nowrap capitalize">{fmt.month(periodIso(iv.periodYear, iv.periodMonth))}</td>
                      <td className="px-4 py-3 text-gray-900 tabular-nums">{fmt.money(iv.amountCents)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${invStatusStyle[iv.status]}`}>
                          {t(`invStatus_${iv.status}` as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/invoice/${iv.id}?locale=${locale}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <FileDown className="h-4 w-4" /> PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Methodology */}
      <div className="flex items-start gap-2 text-sm text-gray-500 mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
        <span>{t('methodology', { price: fmt.money0(company.pricePerParticipantCents) })}</span>
      </div>
    </div>
  );
}
