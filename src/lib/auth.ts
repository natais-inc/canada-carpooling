import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';
import {
  isAccountLocked,
  recordFailedLogin,
  clearLoginAttempts,
  authTimingSafeDelay,
  AUTH_GENERIC_ERROR,
  generateSessionFingerprint,
} from './security-hardening';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
  },
  providers: [
    // Google sign-in is opt-in: only registered when OAuth credentials are set.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await authTimingSafeDelay();
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. Check brute-force lockout
        const lockStatus = isAccountLocked(email);
        if (lockStatus.locked) {
          await authTimingSafeDelay();
          throw new Error(AUTH_GENERIC_ERROR);
        }

        // 2. Find user
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          // Record failed attempt even for non-existent accounts
          // (prevents account enumeration via lockout timing)
          recordFailedLogin(email);
          await authTimingSafeDelay();
          throw new Error(AUTH_GENERIC_ERROR);
        }

        // 3. Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          const result = recordFailedLogin(email);
          await authTimingSafeDelay();

          if (result.locked) {
            // Log security event
            console.warn(
              `[SECURITY] Account locked: ${email} after ${result.attempts} failed attempts. Lockout: ${result.lockoutMs / 1000}s`
            );
          }

          throw new Error(AUTH_GENERIC_ERROR);
        }

        // 4. Success — clear failed attempts
        clearLoginAttempts(email);

        // Extract headers for session fingerprinting in jwt callback
        const headers = req?.headers;
        const userAgent = typeof headers?.['user-agent'] === 'string' ? headers['user-agent'] : null;
        const acceptLanguage = typeof headers?.['accept-language'] === 'string' ? headers['accept-language'] : null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.profileImage,
          _userAgent: userAgent,
          _acceptLanguage: acceptLanguage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Load the role from the database at sign-in so the session carries it
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id as string },
            select: { role: true },
          });
          token.role = dbUser?.role ?? 'USER';
        } catch {
          token.role = 'USER';
        }
        // Carry over headers captured during authorize for fingerprinting
        if ((user as any)._userAgent) token._userAgent = (user as any)._userAgent;
        if ((user as any)._acceptLanguage) token._acceptLanguage = (user as any)._acceptLanguage;
      }
      // Add session fingerprint on sign-in for hijacking detection
      if (trigger === 'signIn') {
        token.fingerprint = generateSessionFingerprint({
          userAgent: (token._userAgent as string) || null,
          acceptLanguage: (token._acceptLanguage as string) || null,
        });
        token.issuedAt = Date.now();
        // Clean up temporary header fields
        delete token._userAgent;
        delete token._acceptLanguage;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role ?? 'USER';
      }
      return session;
    },
  },
};
