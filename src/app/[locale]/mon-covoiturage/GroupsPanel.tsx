'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UsersRound, Plus, Check, X, Loader2, Car, Crown } from 'lucide-react';

type Member = { membershipId: string; name: string; status: string; isCreator: boolean };
type Group = { id: string; name: string; myMembershipId: string; myStatus: string; members: Member[] };

export default function GroupsPanel({ membershipId, t }: { membershipId: string; t: any }) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<Record<string, string>>({});

  async function load() {
    try {
      const res = await fetch('/api/employee/groups');
      const b = await res.json().catch(() => ({ groups: [] }));
      const mine = (b.groups || []).filter((g: Group) => g.myMembershipId === membershipId);
      setGroups(mine);
    } catch {
      setGroups([]);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipId]);

  async function create() {
    if (creating || !name.trim()) return;
    setCreating(true);
    try {
      const memberEmails = emails.split(',').map((e) => e.trim()).filter(Boolean);
      const res = await fetch('/api/employee/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, name, memberEmails }),
      });
      if (res.ok) {
        setName('');
        setEmails('');
        setShowCreate(false);
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function respond(groupId: string, action: 'accept' | 'decline' | 'leave') {
    setBusy(groupId + action);
    try {
      await fetch('/api/employee/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, membershipId, action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function confirmTrip(groupId: string) {
    setBusy(groupId + 'trip');
    try {
      const res = await fetch('/api/employee/group-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, membershipId }),
      });
      const b = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfirmMsg((prev) => ({ ...prev, [groupId]: t('groupConfirmed', { count: b.logged ?? 0 }) }));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white';

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center gap-2 mb-1">
        <UsersRound className="h-4 w-4 text-brand-600" />
        <h4 className="text-base font-semibold text-gray-900">{t('groupsTitle')}</h4>
      </div>
      <p className="text-sm text-gray-500 mb-3">{t('groupsIntro')}</p>

      {groups === null ? (
        <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> …</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500">{t('groupsEmpty')}</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{g.name}</span>
                  {g.myStatus === 'INVITED' ? (
                    <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">{t('groupPending')}</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {g.members.map((mm) => (
                    <span
                      key={mm.membershipId}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                        mm.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {mm.isCreator ? <Crown className="h-3 w-3" /> : null}
                      {mm.name}
                      {mm.status === 'INVITED' ? ` · ${t('groupPending')}` : ''}
                    </span>
                  ))}
                </div>

                {g.myStatus === 'INVITED' ? (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => respond(g.id, 'accept')}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-brand-700 disabled:opacity-50"
                    >
                      {busy === g.id + 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {t('groupAccept')}
                    </button>
                    <button
                      onClick={() => respond(g.id, 'decline')}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> {t('groupDecline')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      onClick={() => confirmTrip(g.id)}
                      disabled={!!busy}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white text-sm font-medium px-4 py-2 hover:bg-green-700 disabled:opacity-50"
                    >
                      {busy === g.id + 'trip' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />}
                      {t('groupConfirmToday')}
                    </button>
                    {confirmMsg[g.id] ? <span className="ml-3 text-sm text-green-700">{confirmMsg[g.id]}</span> : null}
                    <p className="text-xs text-gray-400 mt-2">{t('groupDriverHint')}</p>
                    <button
                      onClick={() => respond(g.id, 'leave')}
                      disabled={!!busy}
                      className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                    >
                      {t('groupLeave')}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 hover:border-brand-500 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" /> {t('groupCreate')}
            </button>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('groupNamePh')} maxLength={80} />
              <input className={field} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={t('groupEmailsPh')} />
              <p className="text-xs text-gray-400 -mt-1">{t('groupInviteHint')}</p>
              <div className="flex gap-2">
                <button
                  onClick={create}
                  disabled={creating || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t('groupCreateBtn')}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setName(''); setEmails(''); }}
                  className="rounded-lg border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 hover:bg-gray-50"
                >
                  {t('groupCancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
