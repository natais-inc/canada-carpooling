import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  recordConsent,
  withdrawConsent,
  hasValidConsent,
  requestDataExport,
  requestDataDeletion,
  DATA_CATEGORIES,
  CURRENT_PRIVACY_POLICY_VERSION,
  type ConsentType,
} from '@/lib/consent';

// ─── POST /api/consent — Record or update consent ───

const consentSchema = z.object({
  privacyPolicyAccepted: z.boolean(),
  termsAccepted: z.boolean(),
  marketingConsent: z.boolean().optional(),
  locationConsent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const consent = consentSchema.parse(body);

    // PIPEDA requires both privacy policy and terms for service use
    if (!consent.privacyPolicyAccepted || !consent.termsAccepted) {
      return NextResponse.json(
        { error: 'Privacy policy and terms must be accepted to use the service' },
        { status: 400 }
      );
    }

    await recordConsent(session.user.id, consent, req);

    return NextResponse.json({
      success: true,
      consentVersion: CURRENT_PRIVACY_POLICY_VERSION,
      message: 'Consent recorded successfully',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Record consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── GET /api/consent — Check consent status ───

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consentStatus = await hasValidConsent(session.user.id);

    return NextResponse.json({
      ...consentStatus,
      currentVersion: CURRENT_PRIVACY_POLICY_VERSION,
      dataCategories: DATA_CATEGORIES,
    });
  } catch (error: unknown) {
    console.error('Check consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/consent — Withdraw consent ───

const withdrawSchema = z.object({
  consentType: z.enum(['privacy_policy', 'terms', 'marketing', 'location', 'cookies']),
});

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { consentType } = withdrawSchema.parse(body);

    // Warn user about consequences of withdrawing essential consent
    if (consentType === 'privacy_policy' || consentType === 'terms') {
      await withdrawConsent(session.user.id, consentType as ConsentType, req);
      return NextResponse.json({
        success: true,
        warning: 'Essential consent withdrawn. Your account will be deactivated. You may request data deletion.',
        accountDeactivated: true,
      });
    }

    await withdrawConsent(session.user.id, consentType as ConsentType, req);

    return NextResponse.json({
      success: true,
      message: `${consentType} consent withdrawn`,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Withdraw consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
