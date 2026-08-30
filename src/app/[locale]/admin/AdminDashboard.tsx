'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, Building2, ShieldCheck, ShieldX, Star, RefreshCw, Loader2, Receipt, Crown, TrendingUp, Sparkles } from 'lucide-react';

type DemoRequest = {
  id: number;
  name: string;
  organization: string;
  email: string;
  phone: string | null;
  employees: string | null;
  message: string | null;
  locale: string | null;
  created_at: string;
};

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  verificationStatus: string;
  isBanned: boolean;
  averageRating: number;
  totalTripsAsDriver: number;
  totalTripsAsPassenger: number;
  createdAt: string;
};

type PlatformCompany = {
  id: string;
  name: string;
  region: string | null;
  tier: 'STANDARD' | 'ENTERPRISE';
  trialActive: boolean;
  trialDaysLeft: number;
  trialEndsAtIso: string;
  activeParticipants: number;
  runRateCents: number;
  lastMonthParticipants: number;
  lastMonthBillableCents: number;
  pricePerParticipantCents: number;
  totalMembers: number;
};

type PlatformOverview = {
  generatedAtIso: string;
  totals: {
    companies: number;
    trialing: number;
    paying: number;
    activeParticipants: number;
    monthlyRunRateCents: number;
    lastMonthBillableCents: number;
  };
  companies: PlatformCompany[];
};

type Tab = 'companies' | 'demos' | 'users';

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
}

function money(cents: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(cents / 100);
}

const statusStyles: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  unverified: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard({ locale }: { locale: string }) {
  const [tab, setTab] = useState<Tab>('companies');
  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, u, c] = await Promise.all([
        fetch('/api/admin/demo-requests').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/companies').then((r) => r.json()),
      ]);
      setDemos(d.requests || []);
      setUsers(u.users || []);
      setOverview(c && c.companies ? c : null);
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (userId: string, action: string) => {
    setBusyId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "L'action a échoué.");
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, role: data.user.role, verificationStatus: data.user.verificationStatus, isBanned: data.user.isBanned }
              : u
          )
        );
      }
    } catch {
      setError("L'action a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 text-sm">CarpoolWork — gestion interne</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 border border-gray-200 rounded-lg px-3 py-2"
        >
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('companies')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'companies' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Receipt className="h-4 w-4" /> Entreprises {overview ? `(${overview.totals.companies})` : ''}
        </button>
        <button
          onClick={() => setTab('demos')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'demos' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="h-4 w-4" /> Demandes de démo ({demos.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'users' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="h-4 w-4" /> Utilisateurs ({users.length})
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tab === 'companies' ? (
        !overview ? (
          <p className="text-gray-500 text-sm p-6 border border-gray-200 rounded-lg">Aucune donnée entreprise disponible.</p>
        ) : (
          <div>
            {/* Revenue totals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><Building2 className="h-4 w-4" /> Entreprises</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{overview.totals.companies}</div>
                <div className="text-xs text-gray-400 mt-0.5">{overview.totals.trialing} en essai · {overview.totals.paying} payantes</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><Users className="h-4 w-4" /> Participants actifs</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{overview.totals.activeParticipants}</div>
                <div className="text-xs text-gray-400 mt-0.5">ce mois-ci, toutes entreprises</div>
              </div>
              <div className="bg-white border border-brand-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-brand-700 text-xs font-medium mb-1"><Receipt className="h-4 w-4" /> Revenu facturable</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{money(overview.totals.lastMonthBillableCents)}</div>
                <div className="text-xs text-gray-400 mt-0.5">mois écoulé (hors essais)</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><TrendingUp className="h-4 w-4" /> Run-rate mensuel</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{money(overview.totals.monthlyRunRateCents)}</div>
                <div className="text-xs text-gray-400 mt-0.5">potentiel aux niveaux actuels</div>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              {overview.companies.length === 0 ? (
                <p className="text-gray-500 text-sm p-6">Aucune entreprise cliente pour le moment.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Entreprise</th>
                      <th className="px-4 py-3 font-medium">Palier</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium text-right">Membres</th>
                      <th className="px-4 py-3 font-medium text-right">Actifs (mois)</th>
                      <th className="px-4 py-3 font-medium text-right">Run-rate</th>
                      <th className="px-4 py-3 font-medium text-right">Facturable (mois écoulé)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {overview.companies.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          {c.region && <div className="text-gray-500 text-xs">{c.region}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.tier === 'ENTERPRISE' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {c.tier === 'ENTERPRISE' ? <Crown className="h-3 w-3" /> : null}
                            {c.tier === 'ENTERPRISE' ? 'Enterprise' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.trialActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Sparkles className="h-3 w-3" /> Essai · {c.trialDaysLeft} j
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Payante
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">{c.totalMembers}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-medium">{c.activeParticipants}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">{money(c.runRateCents)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-medium">
                          {c.trialActive ? <span className="text-amber-600">{money(0)}</span> : money(c.lastMonthBillableCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Facturation rétrospective : 20 $/participant actif/mois, facturé le mois suivant. « Facturable » exclut les entreprises encore en essai.
            </p>
          </div>
        )
      ) : tab === 'demos' ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {demos.length === 0 ? (
            <p className="text-gray-500 text-sm p-6">Aucune demande de démo pour le moment.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Organisation</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Employés</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demos.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(d.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3">{d.organization}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${d.email}`} className="text-brand-600 hover:underline">{d.email}</a>
                      {d.phone && <div className="text-gray-500">{d.phone}</div>}
                    </td>
                    <td className="px-4 py-3">{d.employees || '—'}</td>
                    <td className="px-4 py-3 max-w-xs text-gray-600">{d.message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm p-6">Aucun utilisateur.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Vérification</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 font-medium">Inscrit</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${u.isBanned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                        {u.isBanned && <span className="ml-2 text-xs text-red-600">(banni)</span>}
                      </div>
                      <div className="text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusStyles[u.verificationStatus] || statusStyles.unverified}`}>
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Star className="h-3.5 w-3.5 text-amber-500" /> {u.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {u.verificationStatus !== 'verified' && (
                          <button onClick={() => act(u.id, 'verify')} disabled={busyId === u.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
                            <ShieldCheck className="h-3.5 w-3.5" /> Vérifier
                          </button>
                        )}
                        {u.verificationStatus !== 'rejected' && (
                          <button onClick={() => act(u.id, 'reject')} disabled={busyId === u.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50">
                            <ShieldX className="h-3.5 w-3.5" /> Rejeter
                          </button>
                        )}
                        {u.role === 'USER' ? (
                          <button onClick={() => act(u.id, 'promote')} disabled={busyId === u.id}
                            className="text-xs px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50">
                            Promouvoir admin
                          </button>
                        ) : (
                          <button onClick={() => act(u.id, 'demote')} disabled={busyId === u.id}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                            Retirer admin
                          </button>
                        )}
                        {u.isBanned ? (
                          <button onClick={() => act(u.id, 'unban')} disabled={busyId === u.id}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                            Réactiver
                          </button>
                        ) : (
                          <button onClick={() => act(u.id, 'ban')} disabled={busyId === u.id}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50">
                            Bannir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
