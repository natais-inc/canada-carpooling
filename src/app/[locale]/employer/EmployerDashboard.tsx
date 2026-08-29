'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Building2, Users, Car, Leaf, TreePine, Fuel, ParkingCircle, Info, UserPlus, Loader2,
} from 'lucide-react';
import type { EmployerDashboardData, EmployerMember } from '@/lib/employer-metrics';

function useNumber(locale: string) {
  const loc = locale === 'en' ? 'en-CA' : 'fr-CA';
  return {
    int: (n: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(Math.round(n)),
    dec1: (n: number) => new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n),
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

function Metric({ icon: Icon, value, label, hint }: { icon: any; value: string; label: string; hint?: string }) {
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

export default function EmployerDashboard({ data, locale }: { data: EmployerDashboardData; locale: string }) {
  const t = useTranslations('employer');
  const fmt = useNumber(locale);
  const router = useRouter();
  const { company, counts, projection, members } = data;

  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/employer/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), department: department.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ kind: 'ok', text: t('msg_added') });
        setEmail('');
        setDepartment('');
        router.refresh();
      } else {
        const key = `msg_${body?.error}`;
        const known = ['msg_no_account', 'msg_already_member', 'msg_email_required'];
        setMsg({ kind: 'err', text: known.includes(key) ? t(key as any) : t('msg_error') });
      }
    } catch {
      setMsg({ kind: 'err', text: t('msg_error') });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(membershipId: string, status: 'ACTIVE' | 'REMOVED') {
    if (rowBusy) return;
    setRowBusy(membershipId);
    setMsg(null);
    try {
      const res = await fetch('/api/employer/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, status }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: t('msg_error') });
      }
    } catch {
      setMsg({ kind: 'err', text: t('msg_error') });
    } finally {
      setRowBusy(null);
    }
  }

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
        <Metric icon={Car} value={fmt.dec1(projection.carsRemoved)} label={t('carsRemoved')} />
        <Metric icon={Leaf} value={`${fmt.int(projection.co2KgYear)} kg`} label={t('co2Avoided')} hint={t('perYear')} />
        <Metric icon={TreePine} value={fmt.int(projection.trees)} label={t('treesEquivalent')} />
        <Metric icon={Fuel} value={`${fmt.int(projection.litresYear)} L`} label={t('fuelSaved')} hint={t('perYear')} />
        <Metric icon={ParkingCircle} value={fmt.money(projection.parkingYear)} label={t('parkingSaved')} hint={t('perYear')} />
      </div>

      {/* Members */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('membersTitle')}</h2>
      </div>

      {/* Invite form */}
      <form onSubmit={invite} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('inviteEmailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employe@entreprise.ca"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('inviteDeptLabel')}</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={t('inviteDeptPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t('inviteButton')}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{t('inviteHint')}</p>
        {msg ? (
          <p className={`text-sm mt-2 ${msg.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        ) : null}
      </form>

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
                <th className="px-4 py-3 font-medium text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {t('noMembers')}
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isAdmin = m.role === 'EMPLOYER_ADMIN';
                  const rowLoading = rowBusy === m.id;
                  return (
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <span className="text-gray-300">—</span>
                        ) : rowLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin inline text-gray-400" />
                        ) : (
                          <span className="inline-flex gap-3">
                            {m.status === 'INVITED' ? (
                              <button
                                onClick={() => setStatus(m.id, 'ACTIVE')}
                                className="text-brand-600 hover:text-brand-700 font-medium"
                              >
                                {t('actionActivate')}
                              </button>
                            ) : null}
                            <button
                              onClick={() => setStatus(m.id, 'REMOVED')}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              {t('actionRemove')}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
