import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import JoinCompany from './JoinCompany';

export const dynamic = 'force-dynamic';

// Phase 4 — self-join via a posted QR/join code.
export default async function JoinCompanyPage({ params }: { params: { locale: string; code: string } }) {
  const { locale, code } = params;
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!(session?.user as any)?.id;

  let companyName = '';
  let department: string | null = null;
  let valid = false;
  try {
    const jc = await prisma.companyJoinCode.findUnique({
      where: { code },
      select: { enabled: true, department: true, company: { select: { name: true } } },
    });
    if (jc && jc.enabled) {
      valid = true;
      companyName = jc.company.name;
      department = jc.department;
    }
  } catch {
    valid = false;
  }

  return (
    <JoinCompany locale={locale} code={code} companyName={companyName} department={department} valid={valid} isLoggedIn={isLoggedIn} />
  );
}
