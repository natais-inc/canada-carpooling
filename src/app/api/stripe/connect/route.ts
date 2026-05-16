import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createConnectAccount, createAccountLink, createLoginLink, getAccountStatus } from '@/lib/stripe';

/**
 * POST /api/stripe/connect — Start Stripe Connect onboarding for a driver.
 * This allows the platform to charge the driver $1 + taxes after each trip.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        stripeAccountId: true,
        licenseVerified: true,
        vehicleRegistrationVerified: true,
        insuranceVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Driver must have completed verification first
    if (!user.licenseVerified) {
      return NextResponse.json(
        { error: 'License verification required before Stripe setup' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // If already has Connect account, check status or create login link
    if (user.stripeAccountId) {
      const status = await getAccountStatus(user.stripeAccountId);

      if (status?.detailsSubmitted) {
        // Account fully onboarded — return dashboard link
        const loginLink = await createLoginLink(user.stripeAccountId);
        return NextResponse.json({
          status: 'active',
          dashboardUrl: loginLink?.url,
          chargesEnabled: status.chargesEnabled,
        });
      }

      // Incomplete onboarding — generate new link
      const accountLink = await createAccountLink(
        user.stripeAccountId,
        `${baseUrl}/profile?stripe=refresh`,
        `${baseUrl}/profile?stripe=complete`
      );

      return NextResponse.json({
        status: 'pending',
        onboardingUrl: accountLink?.url,
      });
    }

    // Create new Connect account
    const account = await createConnectAccount(user.email, user.id);
    if (!account) {
      return NextResponse.json({ error: 'Stripe unavailable' }, { status: 503 });
    }

    // Save account ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const accountLink = await createAccountLink(
      account.id,
      `${baseUrl}/profile?stripe=refresh`,
      `${baseUrl}/profile?stripe=complete`
    );

    return NextResponse.json({
      status: 'created',
      onboardingUrl: accountLink?.url,
    });
  } catch (error: unknown) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/stripe/connect — Check driver's Stripe Connect status.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ status: 'not_connected', chargesEnabled: false });
    }

    const status = await getAccountStatus(user.stripeAccountId);
    if (!status) {
      return NextResponse.json({ status: 'error', chargesEnabled: false });
    }

    return NextResponse.json({
      status: status.detailsSubmitted ? 'active' : 'pending',
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
    });
  } catch (error: unknown) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
