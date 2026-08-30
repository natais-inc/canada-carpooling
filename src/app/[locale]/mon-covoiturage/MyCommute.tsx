'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Check, X, Loader2, MapPin, Clock, Car } from 'lucide-react';

export type EmployeeMembership = {
  id: string;
  status: 'INVITED' | 'ACTIVE';
  department: string | null;
  homeFsa: string | null;
  homeCity: string | null;
  workSite: string | null;
  commuteDays: string | null;
  arriveBy: string | null;
  departAt: string | null;
  commuteRole: string | null;
  company: { name: string; region: string | null };
};

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function InviteCard({ m, t }: { m: EmployeeMembership; t: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  async function act(action: 'accept' | 'decline') {
    if (busy) return;
    setBusy(action);
    try {
      const res = await fetch('/api/employee/memberships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId: m.id, action }),
      });
      if (res.ok) router.refresh();
      else setBusy(null);
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-brand-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-brand-700 font-medium">{t('inviteEyebrow')}</p>
          <h3 className="text-lg font-semibold text-gray-900">{m.company.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('inviteBody')}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => act('accept')}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t('accept')}
        </button>
        <button
          onClick={() => act('decline')}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'decline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          {t('decline')}
        </button>
      </div>
    </div>
  );
}

function CommuteForm({ m, t }: { m: EmployeeMembership; t: any }) {
  const router = useRouter();
  const [homeFsa, setHomeFsa] = useState(m.homeFsa || '');
  const [homeCity, setHomeCity] = useState(m.homeCity || '');
  const [workSite, setWorkSite] = useState(m.workSite || '');
  const [days, setDays] = useState<number[]>(
    m.commuteDays ? m.commuteDays.split(',').map((n) => parseInt(n, 10)).filter(Boolean) : [1, 2, 3, 4, 5]
  );
  const [arriveBy, setArriveBy] = useState(m.arriveBy || '');
  const [departAt, setDepartAt] = useState(m.departAt || '');
  const [role, setRole] = useState(m.commuteRole || 'either');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/employee/commute', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: m.id,
          homeFsa, homeCity, workSite,
          commuteDays: days, arriveBy, departAt, commuteRole: role,
        }),
      });
      if (res.ok) {
        setMsg({ ok: true, text: t('saved') });
        router.refresh();
      } else {
        setMsg({ ok: false, text: t('saveError') });
      }
    } catch {
      setMsg({ ok: false, text: t('saveError') });
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
          <Check className="h-3 w-3" /> {t('activeAt')}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{m.company.name}</h3>
      <p className="text-sm text-gray-600 mt-1 mb-4">{t('commuteIntro')}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}><MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{t('homeCity')}</label>
          <input className={field} value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder={t('homeCityPh')} />
        </div>
        <div>
          <label className={label}>{t('homeFsa')}</label>
          <input className={field} value={homeFsa} onChange={(e) => setHomeFsa(e.target.value.toUpperCase())} maxLength={3} placeholder="L1H" />
          <p className="text-xs text-gray-400 mt-1">{t('homeFsaHint')}</p>
        </div>
        <div className="sm:col-span-2">
          <label className={label}><Building2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{t('workSite')}</label>
          <input className={field} value={workSite} onChange={(e) => setWorkSite(e.target.value)} placeholder={t('workSitePh')} />
        </div>
      </div>

      <div className="mt-4">
        <label className={label}>{t('days')}</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`w-11 py-2 rounded-lg text-sm font-medium border ${
                days.includes(d)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
              }`}
            >
              {t(`day_${d}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <div>
          <label className={label}><Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{t('arriveBy')}</label>
          <input type="time" className={field} value={arriveBy} onChange={(e) => setArriveBy(e.target.value)} />
        </div>
        <div>
          <label className={label}><Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{t('departAt')}</label>
          <input type="time" className={field} value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
        </div>
        <div>
          <label className={label}><Car className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{t('role')}</label>
          <select className={field} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="either">{t('role_either')}</option>
            <option value="driver">{t('role_driver')}</option>
            <option value="passenger">{t('role_passenger')}</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('save')}
        </button>
        {msg ? <span className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

export default function MyCommute({ memberships, locale }: { memberships: EmployeeMembership[]; locale: string }) {
  const t = useTranslations('employee');
  const invited = memberships.filter((m) => m.status === 'INVITED');
  const active = memberships.filter((m) => m.status === 'ACTIVE');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="text-gray-600 mt-1 mb-6">{t('subtitle')}</p>

      {memberships.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          {t('empty')}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {invited.map((m) => <InviteCard key={m.id} m={m} t={t} />)}
          {active.map((m) => <CommuteForm key={m.id} m={m} t={t} />)}
        </div>
      )}
    </div>
  );
}
