/**
 * CarpoolWork — employer impact report download (PDF).
 * Gated by requireCompanyAdmin(); the company is resolved from the caller's
 * membership. Returns a branded, bilingual one-page PDF as an attachment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAdmin } from '@/lib/company';
import { getEmployerDashboard } from '@/lib/employer-metrics';
import { buildEmployerReport } from '@/lib/employer-report';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = await requireCompanyAdmin();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'fr';
  const data = await getEmployerDashboard(access.companyId);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const pdf = await buildEmployerReport(data, locale);
  const slug = data.company.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'entreprise';
  const filename = `carpoolwork-impact-${slug}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
