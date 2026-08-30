'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, Check, X, Loader2, MapPin, Clock, Car, Users, Sparkles, Leaf, Route, TreePine, Bell } from 'lucide-react';
import type { Match } from '@/lib/matching';

export type PersonalImpact = {
  monthCarpools: number;
  allTimeCarpools: number;
  monthKm: number;
  monthCo2Kg: number;
  allTimeKm: number;
  allTimeCo2Kg: number;
  allTimeTrees: number;
};

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
  homeLat: number | null;
  homeLng: number | null;
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

function MatchList({ matches, t, locale }: { matches: Match[]; t: any; locale: string }) {
  const km1 = (n: number) =>
    n.toLocaleString(locale === 'en' ? 'en-CA' : 'fr-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h4 className="text-base font-semibold text-gray-900">{t('matchesTitle')}</h4>
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">{t('matchesEmpty')}</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{t('matchesIntro', { count: matches.length })}</p>
          <div className="flex flex-col gap-2.5">
            {matches.map((mt) => (
              <div key={mt.membershipId} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{mt.name}</span>
                    {mt.department ? <span className="text-xs text-gray-400">{mt.department}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {mt.sharedDays.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 rounded px-1.5 py-0.5">
                        {mt.sharedDays.map((d) => t(`day_${d}`)).join(' · ')}
                      </span>
                    )}
                    {mt.distanceKm != null ? (
                      <span
                        className={`text-xs rounded px-1.5 py-0.5 ${
                          mt.within2km ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t('atDistance', { km: km1(mt.distanceKm) })}
                      </span>
                    ) : mt.sameFsa ? (
                      <span className="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">{t('sameArea')}</span>
                    ) : mt.sameCity ? (
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t('sameCity')}</span>
                    ) : null}
                    {mt.timeGapMin != null && mt.timeGapMin <= 30 && (
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t('closeTimes')}</span>
                    )}
                    {mt.role && (
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t(`role_${mt.role}`)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">{t('matchesSoon')}</p>
        </>
      )}
    </div>
  );
}

function ImpactPanel({ impact, t, locale }: { impact: PersonalImpact; t: any; locale: string }) {
  const loc = locale === 'en' ? 'en-CA' : 'fr-CA';
  const int = (n: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(Math.round(n));
  const dec1 = (n: number) =>
    new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="h-4 w-4 text-green-600" />
        <h4 className="text-base font-semibold text-gray-900">{t('impactTitle')}</h4>
      </div>

      {impact.allTimeCarpools === 0 ? (
        <p className="text-sm text-gray-500">{t('impactEmpty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <div className="flex justify-center mb-1"><Car className="h-4 w-4 text-green-600" /></div>
              <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">{int(impact.monthCarpools)}</div>
              <div className="text-xs text-gray-500 mt-1">{t('impactCarpoolsMonth')}</div>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <div className="flex justify-center mb-1"><Route className="h-4 w-4 text-green-600" /></div>
              <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">{int(impact.monthKm)}</div>
              <div className="text-xs text-gray-500 mt-1">{t('impactKmMonth')}</div>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <div className="flex justify-center mb-1"><Leaf className="h-4 w-4 text-green-600" /></div>
              <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">{int(impact.monthCo2Kg)}</div>
              <div className="text-xs text-gray-500 mt-1">{t('impactCo2Month')}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
            <TreePine className="h-3.5 w-3.5 text-green-600 shrink-0" />
            {t('impactAllTime', {
              carpools: int(impact.allTimeCarpools),
              co2: int(impact.allTimeCo2Kg),
              trees: dec1(impact.allTimeTrees),
            })}
          </p>
        </>
      )}
    </div>
  );
}

function CommuteForm({
  m, t, matches, locale, carpoolCount, impact, nudge,
}: {
  m: EmployeeMembership; t: any; matches: Match[]; locale: string; carpoolCount: number; impact: PersonalImpact | null; nudge: boolean;
}) {
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
  const [lat, setLat] = useState<number | null>(m.homeLat);
  const [lng, setLng] = useState<number | null>(m.homeLng);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Carpool logging (brick 3)
  const [partner, setPartner] = useState('');
  const [logBusy, setLogBusy] = useState(false);
  const [count, setCount] = useState(carpoolCount);
  const [logDone, setLogDone] = useState(false);

  function useMyLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeoErr(true); return; }
    setGeoBusy(true);
    setGeoErr(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGeoBusy(false); },
      () => { setGeoErr(true); setGeoBusy(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }

  async function logCarpool() {
    if (logBusy) return;
    setLogBusy(true);
    setLogDone(false);
    try {
      const res = await fetch('/api/employee/carpool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId: m.id, partnerName: partner || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setCount(typeof body.monthCount === 'number' ? body.monthCount : count + 1);
        setLogDone(true);
        setPartner('');
        router.refresh(); // recompute measured impact from the server
      }
    } catch {
      /* ignore */
    } finally {
      setLogBusy(false);
    }
  }

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
          homeLat: lat, homeLng: lng,
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

      {nudge ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Bell className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">{t('nudgeTitle')}</p>
            <p className="text-sm text-amber-800">{t('nudgeBody')}</p>
          </div>
          <button
            onClick={logCarpool}
            disabled={logBusy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 text-white text-sm font-medium px-3 py-2 hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
          >
            {logBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('nudgeAction')}
          </button>
        </div>
      ) : null}

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
        <label className={label}>{t('homeLocation')}</label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 px-3 py-2 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
          >
            {geoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {t('useMyLocation')}
          </button>
          {lat != null && lng != null ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-700">
              <Check className="h-4 w-4" /> {t('locationSet')}
            </span>
          ) : (
            <span className="text-sm text-gray-400">{t('locationNotSet')}</span>
          )}
        </div>
        {geoErr ? <p className="text-xs text-red-600 mt-1">{t('locationError')}</p> : null}
        <p className="text-xs text-gray-400 mt-1">{t('homeLocationHint')}</p>
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

      <MatchList matches={matches} t={t} locale={locale} />

      {/* Brick 3 — record a carpool */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <Car className="h-4 w-4 text-brand-600" />
          <h4 className="text-base font-semibold text-gray-900">{t('logTitle')}</h4>
        </div>
        <p className="text-sm text-gray-500 mb-3">{t('logIntro', { count })}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {matches.length > 0 && (
            <select className={`${field} sm:max-w-[240px]`} value={partner} onChange={(e) => setPartner(e.target.value)}>
              <option value="">{t('logPartnerNone')}</option>
              {matches.map((mt) => (
                <option key={mt.membershipId} value={mt.name}>{mt.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={logCarpool}
            disabled={logBusy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
          >
            {logBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('logButton')}
          </button>
          {logDone ? <span className="text-sm text-green-700">{t('logDone')}</span> : null}
        </div>
      </div>

      {/* Brick 4 — the member's own measured impact */}
      {impact ? <ImpactPanel impact={impact} t={t} locale={locale} /> : null}
    </div>
  );
}

export default function MyCommute({
  memberships,
  matchesByMembership,
  carpoolCountByMembership,
  impactByMembership,
  nudgeByMembership,
  locale,
}: {
  memberships: EmployeeMembership[];
  matchesByMembership: Record<string, Match[]>;
  carpoolCountByMembership: Record<string, number>;
  impactByMembership: Record<string, PersonalImpact>;
  nudgeByMembership: Record<string, boolean>;
  locale: string;
}) {
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
          {active.map((m) => (
            <CommuteForm
              key={m.id}
              m={m}
              t={t}
              locale={locale}
              matches={matchesByMembership[m.id] || []}
              carpoolCount={carpoolCountByMembership[m.id] || 0}
              impact={impactByMembership[m.id] || null}
              nudge={!!nudgeByMembership[m.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
