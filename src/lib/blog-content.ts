/**
 * Server-only merge layer for the blog.
 *
 * Canonical article content lives in `blog.ts` (static, ships with the build).
 * Admins can save per-article corrections that are stored in the
 * "BlogArticleOverride" table (created lazily via raw SQL — no Prisma
 * migration, same pattern as EmployerDemoRequest). At render time we merge any
 * override on top of the static article, so a correction is live immediately.
 *
 * This module imports Prisma and must only be used from server components /
 * route handlers — never from a client component.
 */
import { prisma } from './db';
import { articles as baseArticles, getArticle as getBaseArticle } from './blog';
import type { BlogArticle, BlogArticleLocale } from './blog';

export type ArticleOverride = {
  date?: string;
  readingMinutes?: number;
  author?: string;
  fr?: Partial<BlogArticleLocale>;
  en?: Partial<BlogArticleLocale>;
};

function merge(base: BlogArticle, ov?: ArticleOverride): BlogArticle {
  if (!ov) return base;
  return {
    ...base,
    date: ov.date || base.date,
    readingMinutes:
      typeof ov.readingMinutes === 'number' ? ov.readingMinutes : base.readingMinutes,
    author: ov.author || base.author,
    fr: { ...base.fr, ...(ov.fr || {}) },
    en: { ...base.en, ...(ov.en || {}) },
  };
}

async function getOverrideMap(): Promise<Record<string, ArticleOverride>> {
  try {
    const rows = await prisma.$queryRaw<{ slug: string; data: any }[]>`
      SELECT slug, data FROM "BlogArticleOverride"
    `;
    const map: Record<string, ArticleOverride> = {};
    for (const r of rows) map[r.slug] = (r.data || {}) as ArticleOverride;
    return map;
  } catch {
    // Table may not exist yet (no correction ever saved) — fall back to canonical.
    return {};
  }
}

export async function getEffectiveArticles(): Promise<BlogArticle[]> {
  const map = await getOverrideMap();
  return baseArticles.map((a) => merge(a, map[a.slug]));
}

export async function getEffectiveArticle(slug: string): Promise<BlogArticle | undefined> {
  const base = getBaseArticle(slug);
  if (!base) return undefined;
  try {
    const rows = await prisma.$queryRaw<{ data: any }[]>`
      SELECT data FROM "BlogArticleOverride" WHERE slug = ${slug} LIMIT 1
    `;
    return merge(base, rows[0]?.data as ArticleOverride | undefined);
  } catch {
    return base;
  }
}
