import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';

const demoRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  organization: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  employees: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  locale: z.string().trim().max(5).optional().or(z.literal('')),
});

/**
 * Stores employer demo requests. Uses a lazily-created raw table so no
 * Prisma migration is required (Vercel build does not run `prisma db push`).
 */
export const POST = apiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const parsed = demoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, organization, email, phone, employees, message, locale } = parsed.data;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EmployerDemoRequest" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        employees TEXT,
        message TEXT,
        locale TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await prisma.$executeRaw`
      INSERT INTO "EmployerDemoRequest" (name, organization, email, phone, employees, message, locale)
      VALUES (${name}, ${organization}, ${email}, ${phone || null}, ${employees || null}, ${message || null}, ${locale || null})`;

    return NextResponse.json({ ok: true });
  },
  {
    rateLimit: { max: 5, windowMs: 60 * 60 * 1000 },
    context: 'employer-demo-request',
  }
);
