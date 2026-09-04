'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react';

type LocaleContent = {
  title: string;
  excerpt: string;
  intro: string;
  sections: { heading?: string; paragraphs: string[] }[];
  sourcesTitle: string;
  sources: { label: string; url: string }[];
};

type Draft = {
  date: string;
  readingMinutes: number;
  author: string;
  fr: LocaleContent;
  en: LocaleContent;
};

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export default function ArticleEditor({
  locale,
  slug,
  initial,
}: {
  locale: string;
  slug: string;
  initial: Draft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [tab, setTab] = useState<'fr' | 'en'>('fr');
  const [status, setStatus] = useState<
    { kind: 'idle' | 'saving' | 'saved' | 'resetting'; msg?: string } | { kind: 'error'; msg: string }
  >({ kind: 'idle' });

  const c = draft[tab];

  function mutate(fn: (d: Draft) => void) {
    setDraft((prev) => {
      const next: Draft = structuredClone(prev);
      fn(next);
      return next;
    });
    if (status.kind === 'saved' || status.kind === 'error') setStatus({ kind: 'idle' });
  }

  async function save() {
    setStatus({ kind: 'saving' });
    try {
      const res = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: 'error', msg: json?.error || `Erreur ${res.status}` });
        return;
      }
      setStatus({ kind: 'saved', msg: 'Enregistré — la correction est en ligne.' });
      router.refresh();
    } catch {
      setStatus({ kind: 'error', msg: 'Impossible de contacter le serveur.' });
    }
  }

  async function reset() {
    if (!confirm("Réinitialiser cet article à sa version d'origine ? Vos corrections manuelles seront supprimées.")) {
      return;
    }
    setStatus({ kind: 'resetting' });
    try {
      const res = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setStatus({ kind: 'error', msg: json?.error || `Erreur ${res.status}` });
        return;
      }
      // Reload so the form shows the canonical content again.
      window.location.reload();
    } catch {
      setStatus({ kind: 'error', msg: 'Impossible de contacter le serveur.' });
    }
  }

  const busy = status.kind === 'saving' || status.kind === 'resetting';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <Link
            href={`/${locale}/blog/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l’article
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Modifier l’article</h1>
          <p className="text-sm text-gray-500 font-mono">{slug}</p>
        </div>
        <a
          href={`/${locale}/blog/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
        >
          Aperçu <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Shared fields */}
      <div className="grid gap-4 sm:grid-cols-3 rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Date (AAAA-MM-JJ)</span>
          <input
            className={inputCls}
            value={draft.date}
            onChange={(e) => mutate((d) => { d.date = e.target.value; })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Minutes de lecture</span>
          <input
            type="number"
            min={1}
            max={120}
            className={inputCls}
            value={draft.readingMinutes}
            onChange={(e) => mutate((d) => { d.readingMinutes = parseInt(e.target.value || '0', 10) || 0; })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Signature</span>
          <input
            className={inputCls}
            value={draft.author}
            onChange={(e) => mutate((d) => { d.author = e.target.value; })}
          />
        </label>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-1 mb-4">
        {(['fr', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              tab === l ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {l === 'fr' ? 'Français' : 'English'}
          </button>
        ))}
      </div>

      {/* Locale content */}
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Titre</span>
          <input
            className={inputCls}
            value={c.title}
            onChange={(e) => mutate((d) => { d[tab].title = e.target.value; })}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Extrait</span>
          <textarea
            rows={3}
            className={inputCls}
            value={c.excerpt}
            onChange={(e) => mutate((d) => { d[tab].excerpt = e.target.value; })}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-gray-600">Introduction</span>
          <textarea
            rows={4}
            className={inputCls}
            value={c.intro}
            onChange={(e) => mutate((d) => { d[tab].intro = e.target.value; })}
          />
        </label>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800">Sections</span>
            <button
              type="button"
              onClick={() => mutate((d) => { d[tab].sections.push({ heading: '', paragraphs: [''] }); })}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800"
            >
              <Plus className="h-4 w-4" /> Ajouter une section
            </button>
          </div>

          <div className="space-y-4">
            {c.sections.map((s, si) => (
              <div key={si} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    className={inputCls}
                    placeholder="Titre de section (optionnel)"
                    value={s.heading || ''}
                    onChange={(e) => mutate((d) => { d[tab].sections[si].heading = e.target.value; })}
                  />
                  <button
                    type="button"
                    onClick={() => mutate((d) => { d[tab].sections.splice(si, 1); })}
                    title="Supprimer la section"
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {s.paragraphs.map((p, pi) => (
                    <div key={pi} className="flex items-start gap-2">
                      <textarea
                        rows={3}
                        className={inputCls}
                        placeholder={`Paragraphe ${pi + 1}`}
                        value={p}
                        onChange={(e) => mutate((d) => { d[tab].sections[si].paragraphs[pi] = e.target.value; })}
                      />
                      <button
                        type="button"
                        onClick={() => mutate((d) => { d[tab].sections[si].paragraphs.splice(pi, 1); })}
                        title="Supprimer le paragraphe"
                        className="mt-1 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => mutate((d) => { d[tab].sections[si].paragraphs.push(''); })}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter un paragraphe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800">Sources</span>
            <button
              type="button"
              onClick={() => mutate((d) => { d[tab].sources.push({ label: '', url: '' }); })}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800"
            >
              <Plus className="h-4 w-4" /> Ajouter une source
            </button>
          </div>

          <label className="block mb-3">
            <span className="text-xs font-semibold text-gray-600">Intitulé de la rubrique</span>
            <input
              className={inputCls}
              value={c.sourcesTitle}
              onChange={(e) => mutate((d) => { d[tab].sourcesTitle = e.target.value; })}
            />
          </label>

          <div className="space-y-2">
            {c.sources.map((src, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid grow gap-2 sm:grid-cols-2">
                  <input
                    className={inputCls}
                    placeholder="Libellé"
                    value={src.label}
                    onChange={(e) => mutate((d) => { d[tab].sources[i].label = e.target.value; })}
                  />
                  <input
                    className={inputCls}
                    placeholder="https://…"
                    value={src.url}
                    onChange={(e) => mutate((d) => { d[tab].sources[i].url = e.target.value; })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => mutate((d) => { d[tab].sources.splice(i, 1); })}
                  title="Supprimer la source"
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 mt-8 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status.kind === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {status.kind === 'resetting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Réinitialiser au contenu d’origine
          </button>

          {status.kind === 'saved' && <span className="text-sm text-green-600">{status.msg}</span>}
          {status.kind === 'error' && <span className="text-sm text-red-600">{status.msg}</span>}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Les corrections sont enregistrées en base et s’affichent immédiatement, sans redéploiement. « Réinitialiser » restaure le texte d’origine du fichier de contenu.
        </p>
      </div>
    </div>
  );
}
