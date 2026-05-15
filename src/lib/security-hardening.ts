/**
 * Security Hardening — Canada Carpooling
 * Covers: file upload validation, session hijacking prevention,
 * brute-force lockout, account enumeration protection,
 * dependency/header auditing, and bot detection.
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD SECURITY
// ═══════════════════════════════════════════════════════════════

/** Allowed MIME types for user uploads (profile photos, vehicle photos, docs) */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf', // identity documents
]);

/** Max sizes per category */
const MAX_FILE_SIZES: Record<string, number> = {
  profilePhoto: 5 * 1024 * 1024,    // 5 MB
  vehiclePhoto: 10 * 1024 * 1024,   // 10 MB
  identityDoc: 15 * 1024 * 1024,    // 15 MB
  default: 5 * 1024 * 1024,
};

/** Magic bytes for real file type detection (not just MIME header) */
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
  'application/pdf': [Buffer.from('%PDF')],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an uploaded file:
 * - MIME type whitelist
 * - File size limit
 * - Magic byte verification (anti file-extension spoofing)
 * - Filename sanitization
 */
export function validateUploadedFile(
  file: { name: string; type: string; size: number; buffer: Buffer },
  category: string = 'default'
): FileValidationResult {
  // 1. MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé: ${file.type}` };
  }

  // 2. Size check
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.default;
  if (file.size > maxSize) {
    return { valid: false, error: `Fichier trop volumineux (max ${maxSize / 1024 / 1024} MB)` };
  }

  // 3. Magic byte verification
  const signatures = FILE_SIGNATURES[file.type];
  if (signatures) {
    const header = file.buffer.subarray(0, 12);
    const matched = signatures.some((sig) => {
      if (file.type === 'image/webp') {
        // WEBP: RIFF at 0 + WEBP at 8
        return header.subarray(0, 4).equals(Buffer.from('RIFF')) &&
               header.subarray(8, 12).equals(Buffer.from('WEBP'));
      }
      return header.subarray(0, sig.length).equals(sig);
    });
    if (!matched) {
      return { valid: false, error: 'Le contenu du fichier ne correspond pas à son type déclaré' };
    }
  }

  // 4. Filename sanitization
  if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name) || file.name.includes('..')) {
    return { valid: false, error: 'Nom de fichier invalide' };
  }

  return { valid: true };
}

/**
 * Generate a safe, unique filename for storage.
 */
export function generateSafeFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const safeExt = ext.replace(/[^a-z0-9]/g, '');
  const uuid = crypto.randomUUID();
  return `${uuid}.${safeExt}`;
}

// ═══════════════════════════════════════════════════════════════
// SESSION HIJACKING PREVENTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a fingerprint hash from request metadata.
 * Store at session creation; compare on every request.
 * If it changes → possible session hijacking → force re-auth.
 */
export function generateSessionFingerprint(req: {
  userAgent?: string | null;
  acceptLanguage?: string | null;
}): string {
  const data = [
    req.userAgent || '',
    req.acceptLanguage || '',
  ].join('|');
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/**
 * Verify session fingerprint matches.
 */
export function verifySessionFingerprint(
  storedFingerprint: string,
  req: { userAgent?: string | null; acceptLanguage?: string | null }
): boolean {
  const current = generateSessionFingerprint(req);
  return crypto.timingSafeEqual(
    Buffer.from(storedFingerprint),
    Buffer.from(current)
  );
}

// ═══════════════════════════════════════════════════════════════
// BRUTE FORCE & ACCOUNT LOCKOUT
// ═══════════════════════════════════════════════════════════════

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

/** In-memory store (use Redis in production) */
const loginAttempts = new Map<string, LoginAttempt>();

const LOCKOUT_CONFIG = {
  maxAttempts: 5,           // 5 failed attempts
  windowMs: 15 * 60 * 1000, // in 15 minutes
  lockoutMs: 30 * 60 * 1000, // → 30 minute lockout
  escalationFactor: 2,      // doubles each successive lockout
};

/**
 * Check if account/IP is currently locked out.
 */
export function isAccountLocked(identifier: string): {
  locked: boolean;
  remainingMs: number;
  attempts: number;
} {
  const entry = loginAttempts.get(identifier);
  if (!entry) return { locked: false, remainingMs: 0, attempts: 0 };

  const now = Date.now();

  // Check lockout
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingMs: entry.lockedUntil - now,
      attempts: entry.count,
    };
  }

  // Reset if window expired
  if (now - entry.firstAttempt > LOCKOUT_CONFIG.windowMs) {
    loginAttempts.delete(identifier);
    return { locked: false, remainingMs: 0, attempts: 0 };
  }

  return { locked: false, remainingMs: 0, attempts: entry.count };
}

/**
 * Record a failed login attempt.
 * Returns lockout info if threshold is reached.
 */
export function recordFailedLogin(identifier: string): {
  locked: boolean;
  lockoutMs: number;
  attempts: number;
} {
  const now = Date.now();
  let entry = loginAttempts.get(identifier);

  if (!entry || now - entry.firstAttempt > LOCKOUT_CONFIG.windowMs) {
    entry = { count: 1, firstAttempt: now, lockedUntil: null };
    loginAttempts.set(identifier, entry);
    return { locked: false, lockoutMs: 0, attempts: 1 };
  }

  entry.count++;

  if (entry.count >= LOCKOUT_CONFIG.maxAttempts) {
    // Escalating lockout: 30 min, 60 min, 120 min...
    const escalation = Math.pow(
      LOCKOUT_CONFIG.escalationFactor,
      Math.floor(entry.count / LOCKOUT_CONFIG.maxAttempts) - 1
    );
    const lockoutMs = LOCKOUT_CONFIG.lockoutMs * escalation;
    entry.lockedUntil = now + lockoutMs;
    return { locked: true, lockoutMs, attempts: entry.count };
  }

  return { locked: false, lockoutMs: 0, attempts: entry.count };
}

/**
 * Clear login attempts on successful login.
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (
      (entry.lockedUntil && entry.lockedUntil < now) ||
      (now - entry.firstAttempt > LOCKOUT_CONFIG.windowMs * 4)
    ) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// ACCOUNT ENUMERATION PROTECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generic error message for auth failures.
 * Never reveal whether the email exists in the system.
 */
export const AUTH_GENERIC_ERROR =
  'Invalid credentials / Identifiants invalides';

/**
 * Add timing-safe delay to auth responses.
 * Prevents attackers from distinguishing existing/non-existing accounts
 * based on response time differences.
 */
export async function authTimingSafeDelay(): Promise<void> {
  // Random delay between 100ms and 300ms
  const delay = 100 + Math.random() * 200;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// ═══════════════════════════════════════════════════════════════
// BOT / AUTOMATED ATTACK DETECTION
// ═══════════════════════════════════════════════════════════════

interface BotSignals {
  /** Missing common browser headers */
  missingHeaders: boolean;
  /** Suspiciously fast form submission */
  tooFast: boolean;
  /** Known bot user-agent patterns */
  botUserAgent: boolean;
}

const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /httpie/i, /python-requests/i,
  /go-http-client/i, /java\//i, /php\//i,
];

/**
 * Detect bot-like behavior in a request.
 */
export function detectBotSignals(req: {
  userAgent?: string | null;
  accept?: string | null;
  acceptLanguage?: string | null;
  acceptEncoding?: string | null;
}): BotSignals {
  const ua = req.userAgent || '';

  return {
    missingHeaders: !req.accept || !req.acceptLanguage || !req.acceptEncoding,
    tooFast: false, // Checked separately with timestamps
    botUserAgent: BOT_UA_PATTERNS.some((p) => p.test(ua)),
  };
}

/**
 * Calculate bot probability score (0-1).
 * Score > 0.6 → likely bot → apply CAPTCHA or block.
 */
export function botScore(signals: BotSignals): number {
  let score = 0;
  if (signals.missingHeaders) score += 0.3;
  if (signals.botUserAgent) score += 0.5;
  if (signals.tooFast) score += 0.3;
  return Math.min(score, 1);
}

// ═══════════════════════════════════════════════════════════════
// HONEYPOT FIELD (anti-spam for forms)
// ═══════════════════════════════════════════════════════════════

/**
 * Check honeypot field: if filled → bot.
 * Add a hidden field (e.g. "website" or "fax") to forms.
 * Real users never see or fill it.
 */
export function isHoneypotTriggered(formData: Record<string, unknown>): boolean {
  const honeypotFields = ['website', 'fax', 'company_url', 'hp_field'];
  return honeypotFields.some((field) => {
    const val = formData[field];
    return typeof val === 'string' && val.length > 0;
  });
}

// ═══════════════════════════════════════════════════════════════
// SECURE COOKIE SETTINGS
// ═══════════════════════════════════════════════════════════════

export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60, // 24 hours
};

export const SESSION_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 8 * 60 * 60, // 8 hours — shorter for sessions
};

// ═══════════════════════════════════════════════════════════════
// SECURITY CHECKLIST AUDIT (dev/CI use)
// ═══════════════════════════════════════════════════════════════

export interface SecurityAuditResult {
  passed: string[];
  warnings: string[];
  critical: string[];
}

/**
 * Runtime security audit — call at startup in dev.
 * Checks that required env vars, secrets, and configs are set.
 */
export function runSecurityAudit(): SecurityAuditResult {
  const passed: string[] = [];
  const warnings: string[] = [];
  const critical: string[] = [];

  // Secret strength
  const secret = process.env.NEXTAUTH_SECRET || '';
  if (!secret) critical.push('NEXTAUTH_SECRET is not set');
  else if (secret.length < 32) warnings.push('NEXTAUTH_SECRET is too short (< 32 chars)');
  else passed.push('NEXTAUTH_SECRET is set and adequate length');

  // Encryption key
  const encKey = process.env.DATA_ENCRYPTION_KEY || '';
  if (!encKey) critical.push('DATA_ENCRYPTION_KEY is not set');
  else if (encKey.length < 64) warnings.push('DATA_ENCRYPTION_KEY should be 64 hex chars (32 bytes)');
  else passed.push('DATA_ENCRYPTION_KEY is set');

  // Hash salt
  if (!process.env.DATA_HASH_SALT) critical.push('DATA_HASH_SALT is not set');
  else passed.push('DATA_HASH_SALT is set');

  // HTTPS in production
  const url = process.env.NEXTAUTH_URL || '';
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    critical.push('NEXTAUTH_URL must use HTTPS in production');
  } else {
    passed.push('NEXTAUTH_URL protocol is acceptable');
  }

  // Stripe keys
  if (!process.env.STRIPE_SECRET_KEY) warnings.push('STRIPE_SECRET_KEY is not set');
  if (!process.env.STRIPE_WEBHOOK_SECRET) warnings.push('STRIPE_WEBHOOK_SECRET is not set');

  // Cron secret
  if (!process.env.CRON_SECRET) warnings.push('CRON_SECRET is not set — data retention cron unprotected');

  return { passed, warnings, critical };
}
