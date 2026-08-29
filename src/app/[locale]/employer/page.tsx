import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { requireCompanyAdmin } from '@/lib/company';
import { getEmployerDashboard } from '@/lib/employer-metrics';
import EmployerDashboard from './EmployerDashboard';

export const dynamic = 'force-dynamic';

// Employer portal — Phase 1 dashboard. Access is gated by company membership
// (EMPLOYER_ADMIN, ACTIVE); the effective company always comes from the
// membership, never from the URL.
export default async function EmployerHome({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  const access = await requireCompanyAdmin();

  if (!access.ok) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Espace employeur</h1>
          <p className="text-gray-600 mt-2">
            Cet espace est réservé aux administrateurs des entreprises abonnées à CarpoolWork.
            Si votre entreprise participe au programme, demandez à votre administrateur de vous
            donner accès.
          </p>
        </div>
      </div>
    );
  }

  const data = await getEmployerDashboard(access.companyId);
  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Espace employeur</h1>
          <p className="text-gray-600 mt-2">
            Entreprise introuvable. Contactez l’équipe CarpoolWork.
          </p>
        </div>
      </div>
    );
  }

  return <EmployerDashboard data={data} locale={locale} />;
}
