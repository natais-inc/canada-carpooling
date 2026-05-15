import { NextRequest, NextResponse } from 'next/server';
import { executeRetentionPolicies } from '@/lib/data-retention';

/**
 * Vercel Cron Job — Data Retention
 * Runs daily at 3 AM (configured in vercel.json).
 * Purges expired accounts, old messages, and stale sessions per PIPEDA.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await executeRetentionPolicies();

    return NextResponse.json({
      success: true,
      report: {
        executedAt: report.executedAt.toISOString(),
        accountsPurged: report.accountsPurged,
        messagesDeleted: report.messagesDeleted,
        sessionsDeleted: report.sessionsDeleted,
        errors: report.errors,
      },
    });
  } catch (error: unknown) {
    console.error('[cron/data-retention] Failed:', error);
    return NextResponse.json(
      { error: 'Data retention job failed' },
      { status: 500 }
    );
  }
}
