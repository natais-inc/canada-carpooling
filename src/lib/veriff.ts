/**
 * Veriff Identity Verification Integration
 * 
 * Veriff handles:
 * - Government ID verification (passport, driver's license, national ID)
 * - Biometric selfie matching (liveness detection + face match)
 * - Document authenticity checks
 * - Canadian document support (provincial licenses, passports)
 * 
 * Flow:
 * 1. User clicks "Verify now" → POST /api/verification → creates Veriff session
 * 2. User completes verification in Veriff iframe/redirect
 * 3. Veriff sends webhook → POST /api/webhooks/veriff → updates user status
 */

const VERIFF_API_KEY = process.env.VERIFF_API_KEY!;
const VERIFF_SECRET_KEY = process.env.VERIFF_SECRET_KEY!;
const VERIFF_BASE_URL = 'https://stationapi.veriff.com/v1';

import crypto from 'crypto';

export interface VeriffSession {
  id: string;
  url: string;
  status: string;
  vendorData: string;
}

export interface VeriffDecision {
  id: string;
  status: 'approved' | 'resubmission_requested' | 'declined' | 'expired' | 'abandoned';
  code: number;
  reason: string | null;
  person: {
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    nationality: string | null;
    idNumber: string | null;
  } | null;
  document: {
    type: string; // PASSPORT, DRIVERS_LICENSE, ID_CARD
    country: string;
    number: string | null;
    validUntil: string | null;
  } | null;
}

/**
 * Create a new Veriff verification session for a user
 */
export async function createVeriffSession(
  userId: string,
  firstName: string,
  lastName: string,
  callbackUrl: string
): Promise<VeriffSession> {
  const response = await fetch(`${VERIFF_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-CLIENT': VERIFF_API_KEY,
    },
    body: JSON.stringify({
      verification: {
        callback: callbackUrl,
        person: {
          firstName,
          lastName,
        },
        vendorData: userId,
        timestamp: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Veriff session creation failed: ${error}`);
  }

  const data = await response.json();
  return {
    id: data.verification.id,
    url: data.verification.url,
    status: data.verification.status,
    vendorData: data.verification.vendorData,
  };
}

/**
 * Get verification decision from Veriff
 */
export async function getVeriffDecision(sessionId: string): Promise<VeriffDecision> {
  const response = await fetch(`${VERIFF_BASE_URL}/sessions/${sessionId}/decision`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-CLIENT': VERIFF_API_KEY,
      'X-HMAC-SIGNATURE': generateHmac(sessionId),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Veriff decision: ${response.statusText}`);
  }

  const data = await response.json();
  return data.verification;
}

/**
 * Verify Veriff webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', VERIFF_SECRET_KEY)
    .update(Buffer.from(payload, 'utf8'))
    .digest('hex')
    .toLowerCase();

  return crypto.timingSafeEqual(
    Buffer.from(signature.toLowerCase()),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate HMAC signature for API requests
 */
function generateHmac(data: string): string {
  return crypto
    .createHmac('sha256', VERIFF_SECRET_KEY)
    .update(Buffer.from(data, 'utf8'))
    .digest('hex')
    .toLowerCase();
}

/**
 * Map Veriff document type to our verification fields
 */
export function mapVeriffDocument(docType: string): {
  idVerified: boolean;
  licenseVerified: boolean;
} {
  switch (docType) {
    case 'DRIVERS_LICENSE':
      return { idVerified: true, licenseVerified: true };
    case 'PASSPORT':
    case 'ID_CARD':
      return { idVerified: true, licenseVerified: false };
    default:
      return { idVerified: false, licenseVerified: false };
  }
}
