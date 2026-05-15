/**
 * Data Security Module — Canada Carpooling
 *
 * Covers:
 * - Field-level encryption (AES-256-GCM) for sensitive PII
 * - Data retention policies with automated cleanup
 * - Security event audit logging
 * - Data anonymization for analytics
 * - Secure data export sanitization
 */

import crypto from 'crypto';

// ==========================================
// AES-256-GCM FIELD ENCRYPTION
// ==========================================

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY; // 32 bytes hex
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns base64 string: iv:authTag:ciphertext
 */
export function encryptField(plaintext: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('[data-security] DATA_ENCRYPTION_KEY not set — storing unencrypted');
    return plaintext;
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a field encrypted with encryptField.
 */
export function decryptField(encryptedValue: string): string {
  if (!encryptedValue.startsWith('enc:')) {
    return encryptedValue; // Not encrypted (legacy or key missing)
  }

  if (!ENCRYPTION_KEY) {
    throw new Error('DATA_ENCRYPTION_KEY required to decrypt data');
  }

  const parts = encryptedValue.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted field format');

  const [, ivB64, authTagB64, ciphertext] = parts;
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Hash a value for lookup (deterministic, non-reversible).
 * Used for searching encrypted fields by exact match.
 */
export function hashForLookup(value: string): string {
  const salt = process.env.DATA_HASH_SALT || 'canada-carpooling-salt';
  return crypto.createHmac('sha256', salt).update(value.toLowerCase().trim()).digest('hex');
}

// ==========================================
// DATA RETENTION POLICIES
// ==========================================

export const RETENTION_POLICIES = {
  // Active user data — retained while account active
  activeAccount: {
    description: 'Personal data for active accounts',
    retentionDays: null as number | null, // Until account deletion
  },
  // Deleted account data — 30 days grace period
  deletedAccount: {
    description: 'Data after account deletion request',
    retentionDays: 30,
  },
  // Financial records — 7 years (Income Tax Act, Canada)
  financialRecords: {
    description: 'Transaction records for tax compliance',
    retentionDays: 7 * 365,
  },
  // Consent logs — 7 years (PIPEDA accountability)
  consentLogs: {
    description: 'Consent audit trail',
    retentionDays: 7 * 365,
  },
  // Data processing logs — 3 years
  processingLogs: {
    description: 'Data processing activity logs',
    retentionDays: 3 * 365,
  },
  // Security logs — 2 years
  securityLogs: {
    description: 'Security event audit trail',
    retentionDays: 2 * 365,
  },
  // Messages — 1 year after trip completion
  messages: {
    description: 'Trip-related messages',
    retentionDays: 365,
  },
  // Session tokens — 30 days
  sessions: {
    description: 'Authentication sessions',
    retentionDays: 30,
  },
} as const;

/**
 * Get the retention cutoff date for a given policy.
 */
export function getRetentionCutoff(policy: keyof typeof RETENTION_POLICIES): Date | null {
  const days = RETENTION_POLICIES[policy].retentionDays;
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ==========================================
// DATA ANONYMIZATION
// ==========================================

/**
 * Anonymize a user record for analytics retention.
 * Replaces PII with hashed/generic values while keeping aggregate-useful data.
 */
export function anonymizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const anonymized = { ...user };

  // Remove PII
  anonymized.firstName = 'ANONYMIZED';
  anonymized.lastName = 'ANONYMIZED';
  anonymized.email = `anon-${hashForLookup(String(user.email || '')).slice(0, 12)}@deleted.local`;
  anonymized.phone = 'ANONYMIZED';
  anonymized.passwordHash = null;
  anonymized.profileImage = null;
  anonymized.consentIp = null;

  // Remove payment info
  anonymized.stripeCustomerId = null;
  anonymized.stripeAccountId = null;

  // Keep aggregate-useful fields
  // createdAt, preferredLanguage, role, isVerified stay for analytics

  return anonymized;
}

/**
 * Anonymize a booking for financial retention.
 * Keeps financial data, removes references to specific users.
 */
export function anonymizeBooking(booking: Record<string, unknown>): Record<string, unknown> {
  const anonymized = { ...booking };

  anonymized.passengerId = `anon-${hashForLookup(String(booking.passengerId || '')).slice(0, 12)}`;
  anonymized.stripePaymentIntentId = null;

  return anonymized;
}

// ==========================================
// SECURITY EVENT AUDIT LOG
// ==========================================

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'login_locked'
  | 'password_change'
  | 'password_reset_request'
  | 'consent_granted'
  | 'consent_withdrawn'
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'account_created'
  | 'account_deactivated'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_failure'
  | 'ip_blocked'
  | 'invalid_origin'
  | 'unauthorized_access'
  | 'admin_action';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

// In-memory buffer for batch writes (flush to DB periodically in production)
const securityEventBuffer: Array<SecurityEvent & { timestamp: Date }> = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Log a security event for audit purposes.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const entry = {
    ...event,
    timestamp: new Date(),
  };

  securityEventBuffer.push(entry);

  // Console log for development / log aggregation (Sentry, Datadog, etc.)
  const level = ['login_failure', 'suspicious_activity', 'csrf_failure', 'ip_blocked', 'unauthorized_access']
    .includes(event.type) ? 'warn' : 'info';

  console[level](`[security] ${event.type}`, {
    userId: event.userId || 'anonymous',
    ip: event.ip,
    details: event.details,
  });

  // Flush if buffer is full
  if (securityEventBuffer.length >= MAX_BUFFER_SIZE) {
    flushSecurityEvents();
  }
}

/**
 * Flush buffered security events (would write to DB/log service in production).
 */
export async function flushSecurityEvents(): Promise<void> {
  if (securityEventBuffer.length === 0) return;

  const events = securityEventBuffer.splice(0);

  // In production: batch insert into SecurityAuditLog table or send to SIEM
  // For now, events are already console-logged above
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[security] Flushed ${events.length} security events`);
  }
}

// ==========================================
// SENSITIVE FIELD CONFIGURATION
// ==========================================

/**
 * Fields that should be encrypted at rest when DATA_ENCRYPTION_KEY is set.
 */
export const SENSITIVE_FIELDS = {
  user: ['phone', 'consentIp'],
  // Note: email is hashed for lookup, not encrypted (needs to be searchable)
  // passwordHash is already bcrypt — no double encryption needed
} as const;

/**
 * Fields that must NEVER appear in API responses, logs, or exports.
 */
export const REDACTED_FIELDS = [
  'passwordHash',
  'stripeCustomerId',
  'stripeAccountId',
  'stripePaymentIntentId',
  'consentIp',
] as const;

/**
 * Remove sensitive fields from an object before sending to client.
 */
export function redactSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  additionalFields: string[] = []
): Partial<T> {
  const redacted = { ...obj };
  const fieldsToRedact = [...REDACTED_FIELDS, ...additionalFields];

  for (const field of fieldsToRedact) {
    if (field in redacted) {
      delete redacted[field as keyof T];
    }
  }

  return redacted;
}

// ==========================================
// SECURE DATA EXPORT
// ==========================================

/**
 * Prepare user data for PIPEDA-compliant export.
 * Removes internal IDs, payment tokens, and system fields.
 */
export function prepareDataExport(data: Record<string, unknown>): Record<string, unknown> {
  const exported = JSON.parse(JSON.stringify(data)); // Deep clone

  // Recursively remove sensitive fields
  function cleanObject(obj: Record<string, unknown>): void {
    for (const key of Object.keys(obj)) {
      if (REDACTED_FIELDS.includes(key as any)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          (obj[key] as unknown[]).forEach(item => {
            if (typeof item === 'object' && item !== null) {
              cleanObject(item as Record<string, unknown>);
            }
          });
        } else {
          cleanObject(obj[key] as Record<string, unknown>);
        }
      }
    }
  }

  cleanObject(exported);
  return exported;
}

// ==========================================
// DATA INTEGRITY CHECKS
// ==========================================

/**
 * Generate a checksum for data integrity verification.
 */
export function generateDataChecksum(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify data integrity against a stored checksum.
 */
export function verifyDataChecksum(data: string, checksum: string): boolean {
  const computed = generateDataChecksum(data);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(checksum));
}
