import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return { ok: false as const, status: 403, error: 'Forbidden — admin only' };
  return { ok: true as const };
}

// GET /api/admin/demo-requests — list employer demo requests (admin only)
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // EmployerDemoRequest is created via raw SQL (not in the Prisma schema),
  // so we read it with a raw query and guard against the table not existing yet.
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, name, organization, email, phone, employees, message, locale, created_at
      FROM "EmployerDemoRequest"
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return NextResponse.json({ requests: rows });
  } catch {
    return NextResponse.json({ requests: [] });
  }
}
