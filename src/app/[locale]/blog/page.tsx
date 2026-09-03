import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { articles, articleLocale } from '@/lib/blog';

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-CA' : 'fr-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogIndexPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('blog');
  const locale = params.locale;
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-medium mb-3">
          <Newspaper className="h-4 w-4" /> {t('title')}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 max-w-2xl">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {sorted.map((a) => {
          const loc = articleLocale(a, locale);
          return (
            <Link
              key={a.slug}
              href={`/${locale}/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(a.date, locale)}
                <span className="text-gray-300">·</span>
                <span>{a.readingMinutes} min</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 leading-snug mb-2 group-hover:text-brand-700">
                {loc.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">{loc.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 mt-4">
                {t('readMore')} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-xs text-gray-400 mt-3">{t('by')} {a.author}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
