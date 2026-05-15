import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { getSecurityHeaders, getClientIP, isIPBlocked, rateLimit, rateLimitResponse, reportSuspiciousActivity, validateOrigin, validateRequestSize } from './lib/security';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // 1. Block banned IPs
  if (isIPBlocked(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. API routes — security layer
  if (pathname.startsWith('/api/')) {
    const isWebhook = pathname.startsWith('/api/webhooks/');

    // Request size guard (1 MB default, 15 MB for upload routes)
    const maxSize = pathname.includes('upload') ? 15 * 1024 * 1024 : 1024 * 1024;
    if (!validateRequestSize(request.headers.get('content-length'), maxSize)) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    // Determine rate limit type
    let limitType: 'auth' | 'api' | 'search' | 'booking' | 'message' | 'webhook' = 'api';
    if (pathname.startsWith('/api/auth/')) limitType = 'auth';
    else if (pathname.startsWith('/api/trips') && request.method === 'GET') limitType = 'search';
    else if (pathname.startsWith('/api/bookings') && request.method === 'POST') limitType = 'booking';
    else if (pathname.startsWith('/api/messages')) limitType = 'message';
    else if (isWebhook) limitType = 'webhook';

    // Apply rate limiting
    const { allowed, remaining, resetAt } = rateLimit(request, limitType);
    if (!allowed) {
      reportSuspiciousActivity(ip);
      return rateLimitResponse(resetAt);
    }

    // Validate origin for non-webhook mutations
    if (!isWebhook && request.method !== 'GET' && !validateOrigin(request)) {
      reportSuspiciousActivity(ip);
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    // Add security headers to API responses
    const response = NextResponse.next();
    const headers = getSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    // Prevent caching of API responses with sensitive data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');

    return response;
  }

  // 3. Page routes — internationalization + security headers
  const response = intlMiddleware(request);
  const secHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(secHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
