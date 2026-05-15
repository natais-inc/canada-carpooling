import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requestDataDeletion } from '@/lib/consent';

// POST /api/consent/data-deletion — Request account & data deletion (PIPEDA right to erasure)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requestDataDeletion(session.user.id, req);

    return NextResponse.json({
      success: true,
      message: 'Data deletion request recorded. Your data will be deleted within 30 days. Financial records may be retained for 7 years as required by Canadian tax law.',
      retentionExceptions: [
        'Financial transaction records (7 years — Income Tax Act)',
        'Anonymized aggregate data (indefinite — no personal identifiers)',
      ],
    });
  } catch (error: unknown) {
    console.error('Data deletion request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
