/**
 * PIPEDA/LPRPDE Consent Management
 * 
 * Canada's Personal Information Protection and Electronic Documents Act (PIPEDA)
 * and Quebec's Loi sur la protection des renseignements personnels (LPRPDE/Law 25)
 * 
 * Key principles implemented:
 * 1. Accountability — organization is responsible for personal info
 * 2. Identifying purposes — purposes must be identified before/at collection
 * 3. Consent — knowledge and consent required
 * 4. Limiting collection — limited to what is necessary
 * 5. Limiting use/disclosure/retention — used only for stated purposes
 * 6. Accuracy — keep info accurate and up to date
 * 7. Safeguards — appropriate security
 * 8. Openness — policies must be available
 * 9. Individual access — right to access and challenge
 * 10. Challenging compliance — ability to challenge
 */

import { prisma } from './db';
import { NextRequest } from 'next/server';
import { getClientIP } from './security';

// Current versions of legal documents
export const CURRENT_PRIVACY_POLICY_VERSION = '2026-09-23';
export const CURRENT_TERMS_VERSION = '2026-09-23';

// ─── Consent Types ───

export type ConsentType = 'privacy_policy' | 'terms' | 'marketing' | 'location' | 'cookies';
export type ConsentAction = 'grant' | 'withdraw' | 'update' | 'data_export_request' | 'data_deletion_request';

export interface ConsentPayload {
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
  marketingConsent?: boolean;
  locationConsent?: boolean;
}

// ─── Data Categories (PIPEDA requires identifying what you collect) ───

export const DATA_CATEGORIES = {
  personal_info: {
    label: 'Personal Information',
    description: 'Name, email, preferred language, optional phone number',
    purpose: 'Account creation, sign-in and support',
    retention: 'Duration of account + 30 days, then anonymized',
    required: true,
  },
  employment: {
    label: 'Employer Membership',
    description: 'Employer, work site, membership status, invitation or join code used',
    purpose: 'Linking you to your employer\'s carpool program',
    retention: 'Duration of membership + 30 days',
    required: true,
  },
  commute: {
    label: 'Commute Profile',
    description: 'Home postal area (FSA), approximate home location, usual arrival and departure times, driver/passenger preference',
    purpose: 'Suggesting colleagues who live nearby and arrive at the same time',
    retention: 'Until you delete it or close your account',
    required: false,
  },
  carpool_activity: {
    label: 'Carpool Activity',
    description: 'Carpool groups, trips logged (date, group, estimated distance)',
    purpose: 'Measuring participation for your employer\'s report and monthly invoice (count of active participants only)',
    retention: 'Duration of account; aggregated statistics kept anonymously',
    required: true,
  },
  technical: {
    label: 'Technical Data',
    description: 'IP address at consent, session cookie, security logs',
    purpose: 'Security, abuse prevention and legal accountability',
    retention: 'Up to 12 months',
    required: true,
  },
} as const;

// ─── Consent Recording ───

/**
 * Record user consent with full audit trail (PIPEDA accountability principle)
 */
export async function recordConsent(
  userId: string,
  consent: ConsentPayload,
  request: NextRequest
): Promise<void> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const now = new Date();

  // Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      privacyPolicyAccepted: consent.privacyPolicyAccepted,
      termsAccepted: consent.termsAccepted,
      marketingConsent: consent.marketingConsent ?? false,
      locationConsent: consent.locationConsent ?? false,
      consentAt: now,
      consentVersion: CURRENT_PRIVACY_POLICY_VERSION,
      consentIp: ip,
      consentWithdrawnAt: null, // Clear any prior withdrawal
    },
  });

  // Log each consent type for audit trail
  const consentTypes: Array<{ type: ConsentType; granted: boolean }> = [
    { type: 'privacy_policy', granted: consent.privacyPolicyAccepted },
    { type: 'terms', granted: consent.termsAccepted },
    { type: 'marketing', granted: consent.marketingConsent ?? false },
    { type: 'location', granted: consent.locationConsent ?? false },
  ];

  await prisma.consentLog.createMany({
    data: consentTypes.map(ct => ({
      userId,
      action: ct.granted ? 'grant' : 'withdraw',
      consentType: ct.type,
      version: CURRENT_PRIVACY_POLICY_VERSION,
      ipAddress: ip,
      userAgent,
      details: JSON.stringify({ timestamp: now.toISOString() }),
    })),
  });
}

/**
 * Withdraw consent (PIPEDA right to withdraw)
 */
export async function withdrawConsent(
  userId: string,
  consentType: ConsentType,
  request: NextRequest
): Promise<void> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const updateData: Record<string, unknown> = {};
  if (consentType === 'marketing') updateData.marketingConsent = false;
  if (consentType === 'location') updateData.locationConsent = false;

  // Cannot withdraw privacy_policy/terms without deleting account
  if (consentType === 'privacy_policy' || consentType === 'terms') {
    updateData.consentWithdrawnAt = new Date();
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await prisma.consentLog.create({
    data: {
      userId,
      action: 'withdraw',
      consentType,
      version: CURRENT_PRIVACY_POLICY_VERSION,
      ipAddress: ip,
      userAgent,
    },
  });
}

/**
 * Check if user has valid, current consent
 */
export async function hasValidConsent(userId: string): Promise<{
  valid: boolean;
  needsRenewal: boolean;
  missingConsents: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      privacyPolicyAccepted: true,
      termsAccepted: true,
      consentVersion: true,
      consentWithdrawnAt: true,
    },
  });

  if (!user) return { valid: false, needsRenewal: false, missingConsents: ['all'] };

  const missingConsents: string[] = [];
  if (!user.privacyPolicyAccepted) missingConsents.push('privacy_policy');
  if (!user.termsAccepted) missingConsents.push('terms');

  const needsRenewal = user.consentVersion !== CURRENT_PRIVACY_POLICY_VERSION;
  const valid = missingConsents.length === 0 && !needsRenewal && !user.consentWithdrawnAt;

  return { valid, needsRenewal, missingConsents };
}

/**
 * Request data export (PIPEDA individual access principle)
 */
export async function requestDataExport(userId: string, request: NextRequest): Promise<void> {
  const ip = getClientIP(request);

  await prisma.user.update({
    where: { id: userId },
    data: { dataExportRequestedAt: new Date() },
  });

  await prisma.consentLog.create({
    data: {
      userId,
      action: 'data_export_request',
      consentType: 'privacy_policy',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  });

  await prisma.dataProcessingLog.create({
    data: {
      userId,
      activity: 'disclosure',
      dataCategory: 'personal_info',
      purpose: 'User data access request (PIPEDA Principle 9)',
      legalBasis: 'consent',
    },
  });
}

/**
 * Request data deletion (right to erasure)
 */
export async function requestDataDeletion(userId: string, request: NextRequest): Promise<void> {
  const ip = getClientIP(request);

  await prisma.user.update({
    where: { id: userId },
    data: { dataDeletionRequestedAt: new Date() },
  });

  await prisma.consentLog.create({
    data: {
      userId,
      action: 'data_deletion_request',
      consentType: 'privacy_policy',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  });
}

/**
 * Log data processing activity (PIPEDA accountability)
 */
export async function logDataProcessing(
  userId: string | null,
  activity: 'collection' | 'use' | 'disclosure' | 'retention' | 'deletion',
  dataCategory: keyof typeof DATA_CATEGORIES,
  purpose: string,
  legalBasis: 'consent' | 'contract' | 'legal_obligation' = 'consent'
): Promise<void> {
  await prisma.dataProcessingLog.create({
    data: { userId, activity, dataCategory, purpose, legalBasis },
  });
}
