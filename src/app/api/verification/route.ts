import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import { createVeriffSession } from '@/lib/veriff';

// POST /api/verification — Start identity verification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PIPEDA consent check
    const consentCheck = await requireValidConsent(session.user.id);
    if (consentCheck) return consentCheck;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, idVerified: true, licenseVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.idVerified && user.licenseVerified) {
      return NextResponse.json({ error: 'Already fully verified' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/profile?verification=complete`;

    const veriffSession = await createVeriffSession(
      session.user.id,
      user.firstName,
      user.lastName,
      callbackUrl
    );

    // Store session ID for webhook matching
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        veriffSessionId: veriffSession.id,
      },
    });

    return NextResponse.json({
      verificationUrl: veriffSession.url,
      sessionId: veriffSession.id,
    });
  } catch (error: unknown) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/verification — Check verification status (all fields including driver-specific)
export async function GET(req: NextRequest) {
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
        role: true,
      },
    });

    return NextResponse.json({
      idVerified: user?.idVerified || false,
      licenseVerified: user?.licenseVerified || false,
      selfieVerified: user?.selfieVerified || false,
      vehicleRegistrationVerified: user?.vehicleRegistrationVerified || false,
      insuranceVerified: user?.insuranceVerified || false,
      status: user?.verificationStatus || 'none',
      role: user?.role || 'USER',
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
