import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getArticle } from '@/lib/blog';
import { getEffectiveArticle } from '@/lib/blog-content';
import ArticleEditor from './ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function AdminBlogEditPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accès réservé</h1>
          <p className="text-gray-600 mt-2">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (!getArticle(slug)) notFound();
  const article = await getEffectiveArticle(slug);
  if (!article) notFound();

  return (
    <ArticleEditor
      locale={locale}
      slug={slug}
      initial={{
        date: article.date,
        readingMinutes: article.readingMinutes,
        author: article.author,
        fr: article.fr,
        en: article.en,
      }}
    />
  );
}
