'use client';

import { useTranslations } from 'next-intl';
import {
  Building2, Users, Car, Leaf, TreePine, Fuel, ParkingCircle, Info,
} from 'lucide-react';
import type { EmployerDashboardData, EmployerMember } from '@/lib/employer-metrics';

function useNumber(locale: string) {
  const loc = locale === 'en' ? 'en-CA' : 'fr-CA';
  return {
    int: (n: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(Math.round(n)),
    money: (n: number) =>
      new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n),
    date: (iso: string) => {
      try {
        return new Date(iso).toLocaleDateString(loc, { dateStyle: 'medium' });
      } catch {
        return iso;
      }
    },
  };
}

function Metric({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: any;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
      {hint ? <div className="text-xs text-gray-400 mt-1">{hint}</div> : null}
    </div>
  );
}

const roleStyles: Record<EmployerMember['role'], string> = {
  EMPLOYER_ADMIN: 'bg-brand-50 text-brand-700',
  MEMBER: 'bg-gray-100 text-gray-600',
};

const statusStyles: Record<EmployerMember['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INVITED: 'bg-amber-100 text-amber-700',
  REMOVED: 'bg-gray-100 text-gray-500',
};

export default function EmployerDashboard({
  data,
  locale,
}: {
  data: EmployerDashboardData;
  locale: string;
}) {
  const t = useTranslations('employer');
  const fmt = useNumber(locale);
  const { company, counts, projection, members } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 mt-0.5">
            {company.region ? `${company.region} · ` : ''}
            {t('adminBadge')}
          </p>
        </div>
      </div>

      {/* Participation */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{t('participationTitle')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Metric icon={Users} value={fmt.int(counts.active)} label={t('activeMembers')} />
        <Metric icon={Users} value={fmt.int(counts.invited)} label={t('invitedMembers')} />
        <Metric icon={Users} value={fmt.int(counts.total)} label={t('totalMembers')} />
      </div>

      {/* Impact projection */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-1">{t('impactTitle')}</h2>
      <div className="flex items-start gap-2 text-sm text-gray-500 mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
        <span>{t('impactDisclaimer', { count: counts.active })}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Metric icon={Car} value={fmt.int(projection.carsRemoved)} label={t('carsRemoved')} />
        <Metric icon={Leaf} value={`${fmt.int(projection.co2KgYear)} kg`} label={t('co2Avoided')} hint={t('perYear')} />
        <Metric icon={TreePine} value={fmt.int(projection.trees)} label={t('treesEquivalent')} />
        <Metric icon={Fuel} value={`${fmt.int(projection.litresYear)} L`} label={t('fuelSaved')} hint={t('perYear')} />
        <Metric icon={ParkingCircle} value={fmt.money(projection.parkingYear)} label={t('parkingSaved')} hint={t('perYear')} />
      </div>

      {/* Members */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{t('membersTitle')}</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-medium">{t('colName')}</th>
                <th className="px-4 py-3 font-medium">{t('colEmail')}</th>
                <th className="px-4 py-3 font-medium">{t('colDepartment')}</th>
                <th className="px-4 py-3 font-medium">{t('colRole')}</th>
                <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3 font-medium">{t('colJoined')}</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {t('noMembers')}
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.email}</td>
                    <td className="px-4 py-3 text-gray-600">{m.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[m.role]}`}>
                        {t(`role_${m.role}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[m.status]}`}>
                        {t(`status_${m.status}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt.date(m.joinedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
