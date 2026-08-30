'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { LinkIcon, Copy, Check, Loader2, X, Send } from 'lucide-react';

type Invite = { id: string; email: string; department: string | null; token: string };

export default function InviteLinks({ locale }: { locale: string }) {
  const t = useTranslations('employer');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const linkFor = (token: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/${locale}/rejoindre/${token}` : `/${locale}/rejoindre/${token}`;

  async function load() {
    try {
      const res = await fetch('/api/employer/invites');
      const data = await res.json();
      setInvites(data.invites || []);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => { load(); }, []);

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 1800);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/employer/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), department: department.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.invite) {
        setEmail('');
        setDepartment('');
        await load();
        copy(data.invite.token);
      } else {
        setError(
          data?.error === 'invalid_email' ? t('inviteLinksErrEmail')
            : data?.error === 'already_member' ? t('inviteLinksErrMember')
            : t('inviteLinksErr')
        );
      }
    } catch {
      setError(t('inviteLinksErr'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    try {
      await fetch('/api/employer/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'revoke' }),
      });
      setInvites((prev) => prev.filter((iv) => iv.id !== id));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <LinkIcon className="h-4 w-4 text-brand-600" />
        <h3 className="text-base font-semibold text-gray-900">{t('inviteLinksTitle')}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">{t('inviteLinksIntro')}</p>

      <form onSubmit={generate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('inviteLinksEmail')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employe@entreprise.ca"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('inviteLinksDept')}</label>
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
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t('inviteLinksGenerate')}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}

      {invites.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('inviteLinksPending')}</p>
          <div className="flex flex-col gap-2">
            {invites.map((iv) => (
              <div key={iv.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{iv.email}</div>
                  <div className="text-xs text-gray-400 truncate font-mono">{linkFor(iv.token)}</div>
                </div>
                <button
                  onClick={() => copy(iv.token)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100"
                >
                  {copied === iv.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === iv.token ? t('inviteLinksCopied') : t('inviteLinksCopy')}
                </button>
                <button
                  onClick={() => revoke(iv.id)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-3.5 w-3.5" /> {t('inviteLinksRevoke')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-3">{t('inviteLinksNone')}</p>
      )}
    </div>
  );
}
