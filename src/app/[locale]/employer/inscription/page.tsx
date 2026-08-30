import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { requireCompanyAdmin } from '@/lib/company';
import EmployerSignupForm from './EmployerSignupForm';

export const dynamic = 'force-dynamic';

// Phase 4 — employer self-serve signup. A logged-in user creates their company
// workspace and becomes its first admin.
export default async function EmployerSignupPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login?callbackUrl=/${locale}/employer/inscription`);

  // Already administers a company → straight to the dashboard.
  const access = await requireCompanyAdmin();
  if (access.ok) redirect(`/${locale}/employer`);

  return <EmployerSignupForm locale={locale} />;
}
