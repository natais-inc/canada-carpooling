/**
 * Consent Middleware — checks valid PIPEDA consent on protected API routes
 *
 * Use in API routes:
 *   const consentCheck = await requireValidConsent(session.user.id);
 *   if (consentCheck) return consentCheck; // Returns 403 if consent invalid
 */

import { NextResponse } from 'next/server';
import { hasValidConsent } from './consent';

/**
 * Check that user has valid consent before allowing API access.
 * Returns null if consent is valid, or a NextResponse error if not.
 */
export async function requireValidConsent(userId: string): Promise<NextResponse | null> {
  const consent = await hasValidConsent(userId);

  if (!consent.valid) {
    if (consent.needsRenewal) {
      return NextResponse.json({
        error: 'consent_renewal_required',
        message: 'Our privacy policy has been updated. Please review and accept the new version.',
        missingConsents: consent.missingConsents,
      }, { status: 403 });
    }

    if (consent.missingConsents.length > 0) {
      return NextResponse.json({
        error: 'consent_required',
        message: 'You must accept the privacy policy and terms of service to use this service.',
        missingConsents: consent.missingConsents,
      }, { status: 403 });
    }

    return NextResponse.json({
      error: 'consent_withdrawn',
      message: 'Your consent has been withdrawn. Please contact support or re-accept terms.',
    }, { status: 403 });
  }

  return null; // Consent is valid, proceed
}
