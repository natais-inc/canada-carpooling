import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeRetentionPolicies } from '@/lib/data-retention';
import { prisma } from '@/lib/db';

// POST /api/admin/data-retention — Execute retention policies (admin or cron)
export async function POST(req: NextRequest) {
  // Auth: either admin session or cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isValidCron) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }
  }

  const report = await executeRetentionPolicies();

  return NextResponse.json({
    success: true,
    report,
  });
}
