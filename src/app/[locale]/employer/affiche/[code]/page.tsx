import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { requireCompanyAdmin } from '@/lib/company';
import { prisma } from '@/lib/db';
import Poster from './Poster';

export const dynamic = 'force-dynamic';

// Printable on-site poster for a join code. Admin only.
export default async function PosterPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  const access = await requireCompanyAdmin();
  if (!access.ok) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
        <p className="text-gray-600">Réservé aux administrateurs de l’entreprise.</p>
      </div>
    );
  }

  const jc = await prisma.companyJoinCode.findFirst({
    where: { code, companyId: access.companyId },
    select: { enabled: true, department: true, company: { select: { name: true } } },
  });
  if (!jc) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
        <p className="text-gray-600">Code introuvable.</p>
      </div>
    );
  }

  return <Poster locale={locale} code={code} companyName={jc.company.name} department={jc.department} enabled={jc.enabled} />;
}
