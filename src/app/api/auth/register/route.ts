import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { recordConsent, logDataProcessing, CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/consent';
import { sanitizeInput, validatePasswordStrength as validatePassword, checkRateLimit, getClientIP } from '@/lib/security';
import { isHoneypotTriggered, authTimingSafeDelay } from '@/lib/security-hardening';
import { createAndSendVerification } from '@/lib/verification';

const registerSchema = z.object({
  firstName: z.string().min(1).max(50).transform(sanitizeInput),
  lastName: z.string().min(1).max(50).transform(sanitizeInput),
  email: z.string().email().max(255).toLowerCase(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).max(128),
  preferredLanguage: z.enum(['fr', 'en']).default('fr'),
  // PIPEDA consent — required at registration
  privacyPolicyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Privacy policy must be accepted / La politique de confidentialité doit être acceptée' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Terms must be accepted / Les conditions doivent être acceptées' }),
  }),
  marketingConsent: z.boolean().default(false),
  locationConsent: z.boolean().default(false),
  // Honeypot fields (hidden, should always be empty)
  website: z.string().max(0).optional(),
  fax: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 registrations per IP per 15 min
    const ip = getClientIP(req);
    if (checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later. / Trop de tentatives. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check — bots fill hidden fields
    if (isHoneypotTriggered(body)) {
      // Return success to avoid revealing detection
      await authTimingSafeDelay();
      return NextResponse.json({ id: 'ok', firstName: '', lastName: '', email: '' }, { status: 201 });
    }

    const data = registerSchema.parse(body);

    // Validate password strength
    const passwordCheck = validatePassword(data.password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.errors.join(', ') }, { status: 400 });
    }

    // Check existing user — use generic message to prevent account enumeration
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      // Don't reveal that account exists — return fake success
      // (the real user won't be affected since we don't create a duplicate)
      await authTimingSafeDelay();
      return NextResponse.json({
        id: 'ok',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      }, { status: 201 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user with consent fields
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        preferredLanguage: data.preferredLanguage,
        // PIPEDA consent recorded at creation
        privacyPolicyAccepted: true,
        termsAccepted: true,
        marketingConsent: data.marketingConsent,
        locationConsent: data.locationConsent,
        consentAt: new Date(),
        consentVersion: CURRENT_PRIVACY_POLICY_VERSION,
        consentIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || 'unknown',
      },
    });

    // Record consent audit trail
    await recordConsent(user.id, {
      privacyPolicyAccepted: true,
      termsAccepted: true,
      marketingConsent: data.marketingConsent,
      locationConsent: data.locationConsent,
    }, req);

    // Log data collection (PIPEDA accountability)
    await logDataProcessing(
      user.id,
      'collection',
      'personal_info',
      'Account registration — name, email, phone collected for service provision',
      'consent'
    );

    // Send email verification (best-effort — never blocks registration).
    try {
      await createAndSendVerification(user.id, user.email, user.firstName, data.preferredLanguage);
    } catch (e) {
      console.error('[register] verification email failed', e);
    }

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
