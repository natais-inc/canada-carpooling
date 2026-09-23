import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requestDataExport } from '@/lib/consent';
import { prisma } from '@/lib/db';

// POST /api/consent/data-export — Request data export (PIPEDA Principle 9)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requestDataExport(session.user.id, req);

    return NextResponse.json({
      success: true,
      message: 'Data export request recorded. You will receive your data within 30 days as required by PIPEDA.',
    });
  } catch (error: unknown) {
    console.error('Data export request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/consent/data-export — Download user data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data (PIPEDA right of access) — current product tables only.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferredLanguage: true,
        role: true,
        consentAt: true,
        consentVersion: true,
        privacyPolicyAccepted: true,
        termsAccepted: true,
        marketingConsent: true,
        createdAt: true,
        updatedAt: true,
        // Excluded: passwordHash and internal identifiers.
      },
    });

    const memberships = await prisma.companyMembership.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        department: true,
        acceptedAt: true,
        homeFsa: true,
        homeCity: true,
        workSite: true,
        commuteDays: true,
        arriveBy: true,
        departAt: true,
        commuteRole: true,
        homeLat: true,
        homeLng: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { name: true } },
        carpoolLogs: {
          select: { id: true, date: true, partnerName: true, groupId: true, createdAt: true },
          orderBy: { date: 'desc' },
        },
        groupMemberships: {
          select: { id: true, status: true, createdAt: true, group: { select: { id: true, name: true } } },
        },
      },
    });

    const consentHistory = await prisma.consentLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '2.0',
      user,
      employerMemberships: memberships,
      consentHistory,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="data-export-${session.user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
