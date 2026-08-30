/**
 * CarpoolWork — NATAIS super-admin: platform billing overview.
 * All client companies with trial/subscription status and revenue. Admin only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlatformOverview } from '@/lib/platform';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') return { ok: false as const, status: 403, error: 'Forbidden — admin only' };
  return { ok: true as const, userId };
}

// GET /api/admin/companies — platform overview (admin only)
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const overview = await getPlatformOverview();
    return NextResponse.json(overview);
  } catch (e: any) {
    return NextResponse.json({ error: 'overview_failed', detail: e?.message || String(e) }, { status: 500 });
  }
}
