/**
 * Centralized Error Handling — Canada Carpooling
 *
 * - Typed application errors with error codes
 * - Structured error responses (bilingual)
 * - API error wrapper for consistent responses
 * - Safe error logging (no PII leak)
 * - Retry logic for transient failures
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ==========================================
// APPLICATION ERROR CODES
// ==========================================

export const ErrorCode = {
  // Auth (1xxx)
  UNAUTHORIZED: 'AUTH_1001',
  INVALID_CREDENTIALS: 'AUTH_1002',
  SESSION_EXPIRED: 'AUTH_1003',
  ACCOUNT_LOCKED: 'AUTH_1004',
  EMAIL_ALREADY_EXISTS: 'AUTH_1005',
  CONSENT_REQUIRED: 'AUTH_1006',
  CONSENT_RENEWAL: 'AUTH_1007',

  // Validation (2xxx)
  VALIDATION_ERROR: 'VAL_2001',
  INVALID_INPUT: 'VAL_2002',
  MISSING_REQUIRED_FIELD: 'VAL_2003',
  INVALID_FORMAT: 'VAL_2004',

  // Business Logic (3xxx)
  TRIP_NOT_FOUND: 'BIZ_3001',
  TRIP_FULL: 'BIZ_3002',
  BOOKING_NOT_FOUND: 'BIZ_3003',
  BOOKING_ALREADY_EXISTS: 'BIZ_3004',
  CANNOT_BOOK_OWN_TRIP: 'BIZ_3005',
  TRIP_IN_PAST: 'BIZ_3006',
  INSUFFICIENT_SEATS: 'BIZ_3007',
  INVALID_PROVINCE: 'BIZ_3008',

  // Payment (4xxx)
  PAYMENT_FAILED: 'PAY_4001',
  STRIPE_ERROR: 'PAY_4002',
  REFUND_FAILED: 'PAY_4003',
  DRIVER_NOT_CONNECTED: 'PAY_4004',

  // Verification (5xxx)
  VERIFICATION_PENDING: 'VER_5001',
  VERIFICATION_FAILED: 'VER_5002',
  VEHICLE_NOT_VERIFIED: 'VER_5003',

  // Rate Limiting (6xxx)
  RATE_LIMITED: 'RATE_6001',
  IP_BLOCKED: 'RATE_6002',

  // System (9xxx)
  INTERNAL_ERROR: 'SYS_9001',
  DATABASE_ERROR: 'SYS_9002',
  EXTERNAL_SERVICE_ERROR: 'SYS_9003',
  NETWORK_ERROR: 'SYS_9004',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ==========================================
// TYPED APPLICATION ERROR
// ==========================================

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCodeType,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Access denied') {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 403);
  }

  static notFound(resource: string) {
    return new AppError(ErrorCode.TRIP_NOT_FOUND, `${resource} not found`, 404);
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static conflict(message: string) {
    return new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, message, 409);
  }

  static rateLimited(retryAfter: number) {
    return new AppError(ErrorCode.RATE_LIMITED, 'Too many requests', 429, { retryAfter });
  }

  static internal(message = 'Internal server error') {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, undefined, false);
  }
}

// ==========================================
// API ERROR HANDLER
// ==========================================

/**
 * Convert any error into a standardized API response.
 * Prevents PII and stack traces from leaking to clients.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log full error server-side (for monitoring/debugging)
  const logContext = context ? `[${context}]` : '';

  // 1. Known application errors
  if (error instanceof AppError) {
    console.error(`${logContext} AppError:`, error.code, error.message);
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // 2. Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    console.warn(`${logContext} Validation error:`, firstError);
    return NextResponse.json(
      {
        error: ErrorCode.VALIDATION_ERROR,
        message: firstError.message,
        field: firstError.path.join('.'),
      },
      { status: 400 }
    );
  }

  // 3. Prisma errors
  if ((error as any)?.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    console.error(`${logContext} Prisma error:`, prismaError.code, prismaError.message);

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        const field = (prismaError.meta?.target as string[])?.join(', ') || 'field';
        return NextResponse.json(
          { error: ErrorCode.EMAIL_ALREADY_EXISTS, message: `A record with this ${field} already exists` },
          { status: 409 }
        );
      case 'P2025': // Record not found
        return NextResponse.json(
          { error: ErrorCode.TRIP_NOT_FOUND, message: 'Record not found' },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          { error: ErrorCode.DATABASE_ERROR, message: 'A database error occurred' },
          { status: 500 }
        );
    }
  }

  if ((error as any)?.constructor?.name === 'PrismaClientValidationError') {
    console.error(`${logContext} Prisma validation:`, (error as any).message);
    return NextResponse.json(
      { error: ErrorCode.VALIDATION_ERROR, message: 'Invalid data format' },
      { status: 400 }
    );
  }

  // 4. Generic errors — never expose internals
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`${logContext} Unhandled error:`, err.message, err.stack);

  return NextResponse.json(
    { error: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
    { status: 500 }
  );
}

// ==========================================
// RETRY LOGIC FOR TRANSIENT FAILURES
// ==========================================

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: unknown) => boolean;
}

/**
 * Retry an async operation with exponential backoff.
 * Use for Stripe API calls, external service requests, etc.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
    retryOn = isTransientError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (attempt >= maxRetries || !retryOn(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        maxDelayMs
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if an error is transient (worth retrying).
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes('econnreset') || message.includes('econnrefused') ||
        message.includes('etimedout') || message.includes('socket hang up') ||
        message.includes('network') || message.includes('fetch failed')) {
      return true;
    }
    // Rate limiting (retry after backoff)
    if ('statusCode' in error && (error as any).statusCode === 429) return true;
    // Server errors (503, 502)
    if ('statusCode' in error && [502, 503].includes((error as any).statusCode)) return true;
  }
  return false;
}

// ==========================================
// SAFE LOGGING (NO PII)
// ==========================================

/**
 * Sanitize an object for safe logging — replace PII with [REDACTED].
 */
export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_FIELDS = ['email', 'phone', 'password', 'passwordHash', 'firstName', 'lastName',
    'name', 'stripeCustomerId', 'stripeAccountId', 'consentIp', 'ip', 'token', 'secret'];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
