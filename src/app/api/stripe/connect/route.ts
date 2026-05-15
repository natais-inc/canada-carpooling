import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireValidConsent } from '@/lib/consent-middleware';
import {
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  getAccountStatus,
} from '@/lib/stripe';

// POST /api/stripe/connect — Start Stripe Connect onboarding
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
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const locale = user.preferredLanguage || 'fr';

    // If user already has a Stripe account, create a new link
    if (user.stripeAccountId) {
      const status = await getAccountStatus(user.stripeAccountId);

      // If onboarding is complete, return dashboard link
      if (status.chargesEnabled && status.payoutsEnabled) {
        const loginLink = await createLoginLink(user.stripeAccountId);
        return NextResponse.json({
          type: 'dashboard',
          url: loginLink.url,
          status,
        });
      }

      // Otherwise, create a new onboarding link
      const accountLink = await createAccountLink(
        user.stripeAccountId,
        `${baseUrl}/${locale}/profile?stripe=refresh`,
        `${baseUrl}/${locale}/profile?stripe=complete`
      );

      return NextResponse.json({
        type: 'onboarding',
        url: accountLink.url,
        status,
      });
    }

    // Create new Stripe Connect account
    const account = await createConnectAccount(
      user.email!,
      user.id,
      user.firstName || '',
      user.lastName || ''
    );

    // Save Stripe account ID to user
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const accountLink = await createAccountLink(
      account.id,
      `${baseUrl}/${locale}/profile?stripe=refresh`,
      `${baseUrl}/${locale}/profile?stripe=complete`
    );

    return NextResponse.json({
      type: 'onboarding',
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error: unknown) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/stripe/connect — Check Stripe Connect status
export async function GET(req: NextRequest) {
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
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    const status = await getAccountStatus(user.stripeAccountId);

    return NextResponse.json({
      connected: true,
      ...status,
    });
  } catch (error: unknown) {
    console.error('Stripe status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
