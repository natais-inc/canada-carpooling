import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { requireCompanyAdmin } from '@/lib/company';

export const dynamic = 'force-dynamic';

// Employer portal — Phase 1 landing. Real dashboard (metrics, employees,
// carpools, report, incentives) is built on top of this guarded shell.
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Espace employeur</h1>
      <p className="text-gray-600 mt-2">
        Bienvenue. Le tableau de bord (participation, employés, covoiturages, rapport d’émissions
        et incitatifs) arrive prochainement.
      </p>
    </div>
  );
}
