/**
 * CarpoolWork — employer (B2B) access control.
 * The effective companyId always comes from the user's membership, never from
 * a client-supplied parameter. All /employer pages and /api/employer routes
 * gate through requireCompanyAdmin.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export type CompanyAccess =
  | { ok: true; userId: string; companyId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Resolve the current user's employer-admin access.
 * Pass a companyId to require admin of that specific company; omit it to get
 * the user's own admin company. Defensive: if the membership table does not
 * exist yet (before the migration is applied) it returns "no access" rather
 * than throwing, so routes stay safe.
 */
export async function requireCompanyAdmin(companyId?: string): Promise<CompanyAccess> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  try {
    const membership = await prisma.companyMembership.findFirst({
      where: {
        userId,
        role: 'EMPLOYER_ADMIN',
        status: 'ACTIVE',
        ...(companyId ? { companyId } : {}),
      },
      select: { companyId: true },
    });
    if (!membership) return { ok: false, status: 403, error: 'Forbidden — employer admin only' };
    return { ok: true, userId, companyId: membership.companyId };
  } catch {
    return { ok: false, status: 403, error: 'Forbidden — employer admin only' };
  }
}

/** The companyId the current user administers, or null. */
export async function getMyEmployerCompanyId(): Promise<string | null> {
  const access = await requireCompanyAdmin();
  return access.ok ? access.companyId : null;
}
