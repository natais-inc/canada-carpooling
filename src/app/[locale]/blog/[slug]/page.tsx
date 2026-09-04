import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Building2, ExternalLink, Pencil } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { articleLocale } from '@/lib/blog';
import { getEffectiveArticle } from '@/lib/blog-content';

export const dynamic = 'force-dynamic';

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-CA' : 'fr-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function viewerIsAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return false;
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return u?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export default async function BlogArticlePage({ params }: { params: { locale: string; slug: string } }) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const article = await getEffectiveArticle(slug);
  const admin = await viewerIsAdmin();

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-6">{t('notFound')}</p>
        <Link href={`/${locale}/blog`} className="inline-flex items-center gap-1 text-brand-600 font-medium">
          <ArrowLeft className="h-4 w-4" /> {t('backToBlog')}
        </Link>
      </div>
    );
  }

  const loc = articleLocale(article, locale);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/${locale}/blog`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> {t('backToBlog')}
        </Link>
        {admin && (
          <Link
            href={`/${locale}/admin/blog/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Link>
        )}
      </div>

      <article>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{loc.title}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(article.date, locale)}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{article.readingMinutes} min</span>
          <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{t('by')} {article.author}</span>
        </div>

        <p className="text-lg text-gray-700 leading-relaxed mb-8">{loc.intro}</p>

        {loc.sections.map((s, i) => (
          <section key={i} className="mb-8">
            {s.heading && <h2 className="text-xl font-bold text-gray-900 mb-3">{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-gray-700 leading-relaxed mb-4">{p}</p>
            ))}
          </section>
        ))}

        {/* Sources */}
        <section className="mt-10 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">{loc.sourcesTitle}</h2>
          <ul className="space-y-2">
            {loc.sources.map((src, i) => (
              <li key={i}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                >
                  <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{src.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Signature */}
        <p className="mt-8 text-sm text-gray-500 italic">— {article.author}</p>
      </article>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-brand-600 text-white p-8 text-center">
        <p className="text-lg font-semibold mb-4">{t('relatedCta')}</p>
        <Link
          href={`/${locale}/employers`}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-gray-100"
        >
          {t('relatedCtaBtn')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
