import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { requireCompanyAdmin } from '@/lib/company';
import { getBillingOverview } from '@/lib/billing';
import BillingView from './BillingView';

export const dynamic = 'force-dynamic';

// Employer billing — Phase 3 (internal engine, no payment processor yet).
// Gated to company admins; the company always comes from the membership.
export default async function BillingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  const access = await requireCompanyAdmin();
  if (!access.ok) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-600 mt-2">
            Cet espace est réservé aux administrateurs des entreprises abonnées à CarpoolWork.
          </p>
        </div>
      </div>
    );
  }

  const overview = await getBillingOverview(access.companyId);
  if (!overview) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-600 mt-2">Entreprise introuvable. Contactez l’équipe CarpoolWork.</p>
        </div>
      </div>
    );
  }

  return <BillingView data={overview} locale={locale} />;
}
