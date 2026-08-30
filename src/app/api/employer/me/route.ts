/**
 * CarpoolWork — lightweight check used by the header to decide whether to show
 * the "Employer portal" link. Always 200; the boolean says whether the current
 * user administers a company. No company data is exposed beyond that flag + id.
 */
import { NextResponse } from 'next/server';
import { requireCompanyAdmin } from '@/lib/company';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireCompanyAdmin();
  return NextResponse.json({
    isEmployerAdmin: access.ok,
    companyId: access.ok ? access.companyId : null,
  });
}
