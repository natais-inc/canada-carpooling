import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/error-handling';
import { checkRateLimit } from '@/lib/security';

type ApiHandler = (
  req: NextRequest,
  context: { params?: Record<string, string>; session?: any }
) => Promise<NextResponse>;

interface ApiHandlerOptions {
  /** Require authenticated session */
  requireAuth?: boolean;
  /** Require specific role */
  requireRole?: 'ADMIN' | 'DRIVER' | 'PASSENGER';
  /** Rate limit: max requests per window */
  rateLimit?: { max: number; windowMs: number };
  /** Context label for error logging */
  context?: string;
}

/**
 * Wraps an API route handler with:
 * - Consistent error handling (catches all errors → safe JSON response)
 * - Optional authentication check
 * - Optional role-based authorization
 * - Optional rate limiting
 *
 * Usage:
 *   export const POST = apiHandler(async (req, { session }) => {
 *     // your logic
 *     return NextResponse.json({ ok: true });
 *   }, { requireAuth: true, context: 'create-booking' });
 */
export function apiHandler(handler: ApiHandler, options: ApiHandlerOptions = {}) {
  return async (req: NextRequest, routeContext?: { params?: Record<string, string> }) => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || 'unknown';
        const key = `${options.context || 'api'}:${ip}`;
        const limited = checkRateLimit(key, options.rateLimit.max);
        if (limited) {
          throw AppError.rateLimited(60);
        }
      }

      // Authentication
      let session = null;
      if (options.requireAuth || options.requireRole) {
        session = await getServerSession(authOptions);
        if (!session?.user) {
          throw AppError.unauthorized('Authentication required / Authentification requise');
        }

        // Role check
        if (options.requireRole && (session.user as any).role !== options.requireRole) {
          throw AppError.forbidden('Insufficient permissions / Permissions insuffisantes');
        }
      }

      return await handler(req, {
        params: routeContext?.params || {},
        session,
      });
    } catch (error: unknown) {
      return handleApiError(error, options.context || 'api');
    }
  };
}

/**
 * Standard success response helper.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Standard created response helper.
 */
export function apiCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}
