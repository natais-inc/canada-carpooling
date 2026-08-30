import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import MyCommute, { type EmployeeMembership } from './MyCommute';

export const dynamic = 'force-dynamic';

// Employee side — Phase 2 brick 1: accept the employer invitation and declare
// the commute profile. Access requires login; the page only shows the user's
// own memberships.
export default async function MyCarpoolPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect(`/${locale}/auth/login`);

  let memberships: EmployeeMembership[] = [];
  try {
    const rows = await prisma.companyMembership.findMany({
      where: { userId, status: { in: ['INVITED', 'ACTIVE'] } },
      select: {
        id: true, status: true, department: true,
        homeFsa: true, homeCity: true, workSite: true,
        commuteDays: true, arriveBy: true, departAt: true, commuteRole: true,
        company: { select: { name: true, region: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    memberships = rows as unknown as EmployeeMembership[];
  } catch {
    memberships = [];
  }

  return <MyCommute memberships={memberships} locale={locale} />;
}
