/**
 * Data Retention Service — Canada Carpooling
 *
 * Automated data lifecycle management per PIPEDA requirements.
 * Run via cron job or scheduled task in production.
 *
 * Policies:
 * - Deleted accounts: purge PII after 30 days, anonymize for analytics
 * - Financial records: retain 7 years (Income Tax Act)
 * - Messages: purge 1 year after trip completion
 * - Security logs: retain 2 years
 * - Sessions: purge after 30 days
 */

import { prisma } from './db';
import { anonymizeUser, getRetentionCutoff, logSecurityEvent } from './data-security';

export interface RetentionReport {
  executedAt: Date;
  accountsPurged: number;
  messagesDeleted: number;
  sessionsDeleted: number;
  consentLogsRetained: number;
  errors: string[];
}

/**
 * Execute all retention policies. Call from a cron job (e.g., daily at 3 AM).
 */
export async function executeRetentionPolicies(): Promise<RetentionReport> {
  const report: RetentionReport = {
    executedAt: new Date(),
    accountsPurged: 0,
    messagesDeleted: 0,
    sessionsDeleted: 0,
    consentLogsRetained: 0,
    errors: [],
  };

  try {
    // 1. Purge deleted accounts past grace period
    report.accountsPurged = await purgeDeletedAccounts();
  } catch (error: unknown) {
    report.errors.push(`Account purge failed: ${error}`);
  }

  try {
    // 2. Delete old messages
    report.messagesDeleted = await purgeOldMessages();
  } catch (error: unknown) {
    report.errors.push(`Message purge failed: ${error}`);
  }

  try {
    // 3. Clean expired sessions
    report.sessionsDeleted = await purgeExpiredSessions();
  } catch (error: unknown) {
    report.errors.push(`Session purge failed: ${error}`);
  }

  logSecurityEvent({
    type: 'admin_action',
    ip: 'system',
    details: `Data retention executed: ${report.accountsPurged} accounts purged, ${report.messagesDeleted} messages deleted, ${report.sessionsDeleted} sessions deleted`,
    metadata: report as unknown as Record<string, unknown>,
  });

  return report;
}

/**
 * Purge accounts that requested deletion > 30 days ago.
 * Anonymize data for analytics, delete PII, retain financial records.
 */
async function purgeDeletedAccounts(): Promise<number> {
  const cutoff = getRetentionCutoff('deletedAccount');
  if (!cutoff) return 0;

  const accountsToDelete = await prisma.user.findMany({
    where: {
      dataDeletionRequestedAt: { not: null, lt: cutoff },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  let purged = 0;

  for (const account of accountsToDelete) {
    try {
      await prisma.$transaction(async (tx) => {
        // Anonymize user record (keep for aggregate analytics)
        const anonymized = anonymizeUser(account as unknown as Record<string, unknown>);
        await tx.user.update({
          where: { id: account.id },
          data: {
            firstName: anonymized.firstName as string,
            lastName: anonymized.lastName as string,
            email: anonymized.email as string,
            phone: null,
            passwordHash: null,
            profileImage: null,
            consentIp: null,
            isActive: false,
            // Keep: createdAt, preferredLanguage, role for aggregate analytics
          },
        });

        // Employer memberships: strip the commute profile (home location, schedule) and close them.
        await tx.companyMembership.updateMany({
          where: { userId: account.id },
          data: {
            status: 'REMOVED',
            department: null,
            homeFsa: null,
            homeCity: null,
            workSite: null,
            commuteDays: null,
            arriveBy: null,
            departAt: null,
            commuteRole: null,
            homeLat: null,
            homeLng: null,
          },
        });
        // Carpool logs stay (aggregate participation counts for the employer report) but lose free-text names.
        await tx.carpoolLog.updateMany({
          where: { membership: { userId: account.id } },
          data: { partnerName: null },
        });
        await tx.carpoolGroupMember.deleteMany({ where: { membership: { userId: account.id } } });
        await tx.emailVerifyToken.deleteMany({ where: { userId: account.id } });
        await tx.session.deleteMany({ where: { userId: account.id } });
        await tx.account.deleteMany({ where: { userId: account.id } });
        // Keep consent logs (PIPEDA accountability).
      });

      purged++;
    } catch (error: unknown) {
      console.error(`[retention] Failed to purge account ${account.id}:`, error);
    }
  }

  return purged;
}

/**
 * Delete messages older than 1 year where the associated trip is completed.
 */
async function purgeOldMessages(): Promise<number> {
  // Legacy B2C messaging was removed; nothing to purge.
  return 0;
}

/**
 * Clean up expired authentication sessions.
 */
async function purgeExpiredSessions(): Promise<number> {
  const cutoff = getRetentionCutoff('sessions');
  if (!cutoff) return 0;

  const result = await prisma.session.deleteMany({
    where: {
      expires: { lt: cutoff },
    },
  });

  return result.count;
}
