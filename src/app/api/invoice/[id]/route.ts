/**
 * CarpoolWork — invoice PDF download.
 * Access: the invoice's company admin (EMPLOYER_ADMIN, ACTIVE) or a platform
 * admin (User.role === 'ADMIN').
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getInvoiceWithCompany } from '@/lib/invoicing';
import { buildInvoicePdf, type InvoiceData } from '@/lib/invoice-pdf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const inv = await getInvoiceWithCompany(params.id);
  if (!inv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Authorize: platform admin, or company admin of this invoice's company.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  let allowed = user?.role === 'ADMIN';
  if (!allowed) {
    const membership = await prisma.companyMembership.findFirst({
      where: { userId, companyId: inv.companyId, role: 'EMPLOYER_ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    allowed = !!membership;
  }
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'fr';
  const data: InvoiceData = {
    number: inv.number,
    periodYear: inv.periodYear,
    periodMonth: inv.periodMonth,
    activeParticipants: inv.activeParticipants,
    pricePerParticipantCents: inv.pricePerParticipantCents,
    amountCents: inv.amountCents,
    currency: inv.currency,
    status: inv.status as InvoiceData['status'],
    issuedAt: inv.issuedAt.toISOString(),
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    company: { name: inv.company.name, region: inv.company.region },
  };

  const pdf = await buildInvoicePdf(data, locale);
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${inv.number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
