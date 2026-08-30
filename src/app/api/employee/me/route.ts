/**
 * CarpoolWork — lightweight check for the header: does the current user belong
 * to (or is invited to) an employer program? Drives the "My carpool" link and
 * its pending-invitation dot. Always 200.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ hasMembership: false, invitedCount: 0, activeCount: 0 });

  try {
    const [invited, active] = await Promise.all([
      prisma.companyMembership.count({ where: { userId, status: 'INVITED' } }),
      prisma.companyMembership.count({ where: { userId, status: 'ACTIVE' } }),
    ]);
    return NextResponse.json({ hasMembership: invited + active > 0, invitedCount: invited, activeCount: active });
  } catch {
    return NextResponse.json({ hasMembership: false, invitedCount: 0, activeCount: 0 });
  }
}
