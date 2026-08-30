'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { QrCode, Loader2, Printer, RotateCw, X, Copy, Check, Plus } from 'lucide-react';

type Code = { id: string; code: string; department: string | null; enabled: boolean; createdAt: string };

export default function EmployerJoinCodes({ locale }: { locale: string }) {
  const t = useTranslations('employer');
  const [domains, setDomains] = useState('');
  const [domainsBusy, setDomainsBusy] = useState(false);
  const [domainsMsg, setDomainsMsg] = useState<string | null>(null);
  const [codes, setCodes] = useState<Code[]>([]);
  const [qr, setQr] = useState<Record<string, string>>({});
  const [dept, setDept] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const linkFor = (code: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/rejoindre-entreprise/${code}`
      : `/${locale}/rejoindre-entreprise/${code}`;

  async function load() {
    try {
      const res = await fetch('/api/employer/join-codes');
      const data = await res.json();
      setDomains(data.allowedEmailDomains || '');
      setCodes(data.codes || []);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => { load(); }, []);

  // Render a QR data URL for each code.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const c of codes) {
        try {
          out[c.code] = await QRCode.toDataURL(linkFor(c.code), { margin: 1, width: 220 });
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setQr(out);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes, locale]);

  async function saveDomains(e: FormEvent) {
    e.preventDefault();
    setDomainsBusy(true);
    setDomainsMsg(null);
    try {
      const res = await fetch('/api/employer/join-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDomains', domains }),
      });
      const data = await res.json();
      if (res.ok) { setDomains(data.allowedEmailDomains || ''); setDomainsMsg(t('qrDomainsSaved')); }
    } catch {
      /* ignore */
    } finally {
      setDomainsBusy(false);
    }
  }

  async function createCode(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await fetch('/api/employer/join-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', department: dept.trim() }),
      });
      setDept('');
      await load();
    } catch {
      /* ignore */
    } finally {
      setCreating(false);
    }
  }

  async function rotate(id: string) {
    await fetch('/api/employer/join-codes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rotate', id }),
    });
    await load();
  }

  async function revoke(id: string) {
    await fetch('/api/employer/join-codes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'revoke' }),
    });
    setCodes((prev) => prev.filter((c) => c.id !== id));
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
    } catch { /* ignore */ }
  }

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <QrCode className="h-4 w-4 text-brand-600" />
        <h3 className="text-base font-semibold text-gray-900">{t('qrTitle')}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">{t('qrIntro')}</p>

      {/* Domain allowlist */}
      <form onSubmit={saveDomains} className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('qrDomainsLabel')}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className={input} value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="durham.ca, ville.durham.ca" />
          <button type="submit" disabled={domainsBusy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50 whitespace-nowrap">
            {domainsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t('qrDomainsSave')}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">{t('qrDomainsHint')}</p>
        {domainsMsg ? <p className="text-xs text-green-700 mt-1">{domainsMsg}</p> : null}
      </form>

      {/* Create a code */}
      <form onSubmit={createCode} className="flex flex-col sm:flex-row gap-2 sm:items-end mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('qrDeptLabel')}</label>
          <input className={input} value={dept} onChange={(e) => setDept(e.target.value)} placeholder={t('qrDeptPh')} />
        </div>
        <button type="submit" disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{t('qrCreate')}
        </button>
      </form>

      {codes.length === 0 ? (
        <p className="text-sm text-gray-400">{t('qrNoCodes')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {codes.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 p-3 flex gap-3">
              {qr[c.code] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr[c.code]} alt="QR" className="w-24 h-24 shrink-0" />
              ) : (
                <div className="w-24 h-24 shrink-0 bg-gray-50 rounded flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{c.department || t('qrAllCompany')}</div>
                <div className="text-xs text-gray-400 truncate font-mono mt-0.5">{linkFor(c.code)}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <a href={`/${locale}/employer/affiche/${c.code}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100">
                    <Printer className="h-3.5 w-3.5" /> {t('qrPrint')}
                  </a>
                  <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                    {copied === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === c.code ? t('qrCopied') : t('qrCopyLink')}
                  </button>
                  <button onClick={() => rotate(c.id)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <RotateCw className="h-3.5 w-3.5" /> {t('qrRotate')}
                  </button>
                  <button onClick={() => revoke(c.id)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                    <X className="h-3.5 w-3.5" /> {t('qrRevoke')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
