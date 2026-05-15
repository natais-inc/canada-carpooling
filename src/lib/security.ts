/**
 * Security utilities for Canada Carpooling
 * - Rate limiting
 * - CSRF protection
 * - Input sanitization
 * - Security headers
 * - IP blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ==========================================
// RATE LIMITING (In-memory, use Redis in prod)
// ==========================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'auth' },       // 5 per 15 min
  api: { maxRequests: 100, windowMs: 60 * 1000, keyPrefix: 'api' },             // 100 per min
  search: { maxRequests: 30, windowMs: 60 * 1000, keyPrefix: 'search' },        // 30 per min
  booking: { maxRequests: 10, windowMs: 60 * 1000, keyPrefix: 'booking' },      // 10 per min
  message: { maxRequests: 50, windowMs: 60 * 1000, keyPrefix: 'message' },      // 50 per min
  upload: { maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'upload' },         // 5 per min
  webhook: { maxRequests: 200, windowMs: 60 * 1000, keyPrefix: 'webhook' },     // 200 per min (Stripe/Veriff)
};

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

export function rateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'api'
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[type];
  const ip = getClientIP(request);
  const key = `${config.keyPrefix}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

// ==========================================
// CSRF PROTECTION
// ==========================================

const CSRF_SECRET = process.env.NEXTAUTH_SECRET || 'csrf-fallback-secret';

export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString(36);
  const data = `${sessionId}:${timestamp}`;
  const hash = crypto.createHmac('sha256', CSRF_SECRET).update(data).digest('hex');
  return `${timestamp}.${hash}`;
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !token.includes('.')) return false;

  const [timestamp, hash] = token.split('.');
  const data = `${sessionId}:${timestamp}`;
  const expectedHash = crypto.createHmac('sha256', CSRF_SECRET).update(data).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
    return false;
  }

  // Token expires after 4 hours
  const tokenAge = Date.now() - parseInt(timestamp, 36);
  return tokenAge < 4 * 60 * 60 * 1000;
}

// ==========================================
// INPUT SANITIZATION
// ==========================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

/**
 * Validate and sanitize URL to prevent open redirect
 */
export function sanitizeRedirectUrl(url: string, allowedHosts: string[] = []): string | null {
  try {
    const parsed = new URL(url, process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const currentHost = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').host;

    if (parsed.host === currentHost || allowedHosts.includes(parsed.host)) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// ==========================================
// SECURITY HEADERS
// ==========================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=(self)',
    // Strict Transport Security (HSTS)
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.veriff.me",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.stripe.com https://*.googleusercontent.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://stationapi.veriff.com wss://*.veriff.me",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://magic.veriff.me",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  };
}

// ==========================================
// IP BLOCKING & SUSPICIOUS ACTIVITY
// ==========================================

const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, { count: number; firstSeen: number }>();

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function reportSuspiciousActivity(ip: string): void {
  const now = Date.now();
  const entry = suspiciousActivity.get(ip);

  if (!entry || now - entry.firstSeen > 60 * 60 * 1000) {
    // Reset after 1 hour
    suspiciousActivity.set(ip, { count: 1, firstSeen: now });
    return;
  }

  entry.count++;
  if (entry.count >= 10) {
    // Auto-block after 10 suspicious events in 1 hour
    blockedIPs.add(ip);
    // Auto-unblock after 24 hours
    setTimeout(() => blockedIPs.delete(ip), 24 * 60 * 60 * 1000);
  }
}

// ==========================================
// PASSWORD SECURITY
// ==========================================

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Minimum 8 characters');
  if (password.length > 128) errors.push('Maximum 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('At least one special character');

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty123', 'abc12345'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common');
  }

  return { valid: errors.length === 0, errors };
}

// ==========================================
// REQUEST VALIDATION HELPERS
// ==========================================

/**
 * Validate that a request body is reasonable size
 */
export function validateRequestSize(contentLength: string | null, maxBytes: number = 1048576): boolean {
  if (!contentLength) return true; // Let other validation handle missing body
  return parseInt(contentLength) <= maxBytes;
}

/**
 * Simple rate limit check by key (for apiHandler wrapper).
 * Returns true if rate limited, false if allowed.
 */
export function checkRateLimit(key: string, max: number, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

/**
 * Check if request comes from allowed origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) return true; // Same-origin requests may not have Origin header

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
