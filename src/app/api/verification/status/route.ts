import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/verification/status — Quick verification status check
// Used by DriverVerificationStatus component
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        idVerified: true,
        licenseVerified: true,
        selfieVerified: true,
        vehicleRegistrationVerified: true,
        insuranceVerified: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Verification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
