import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getArticle } from '@/lib/blog';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return { ok: false as const, status: 403, error: 'Forbidden — admin only' };
  return { ok: true as const, userId };
}

const localeContent = z.object({
  title: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().max(1500),
  intro: z.string().trim().max(5000),
  sections: z
    .array(
      z.object({
        heading: z.string().trim().max(300).optional().or(z.literal('')),
        paragraphs: z.array(z.string().max(8000)).max(20),
      })
    )
    .max(30),
  sourcesTitle: z.string().trim().min(1).max(80),
  sources: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(400),
        url: z.string().trim().url().max(1000),
      })
    )
    .max(30),
});

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ'),
  readingMinutes: z.number().int().min(1).max(120),
  author: z.string().trim().min(1).max(300),
  fr: localeContent,
  en: localeContent,
});

async function ensureTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "BlogArticleOverride" (
      slug TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by TEXT
    )`;
}

// PUT /api/admin/blog/[slug] — save a correction (admin only)
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const slug = params.slug;
  if (!getArticle(slug)) {
    return NextResponse.json({ error: 'Article inconnu' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Contenu invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await ensureTable();
    const dataJson = JSON.stringify(parsed.data);
    await prisma.$executeRaw`
      INSERT INTO "BlogArticleOverride" (slug, data, updated_at, updated_by)
      VALUES (${slug}, ${dataJson}::jsonb, now(), ${auth.userId})
      ON CONFLICT (slug) DO UPDATE
        SET data = EXCLUDED.data, updated_at = now(), updated_by = EXCLUDED.updated_by`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[blog-override] save failed', e);
    return NextResponse.json({ error: 'Échec de l’enregistrement' }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[slug] — remove the correction, revert to canonical (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await prisma.$executeRaw`DELETE FROM "BlogArticleOverride" WHERE slug = ${params.slug}`;
  } catch {
    // Table may not exist yet — nothing to revert.
  }
  return NextResponse.json({ ok: true });
}
