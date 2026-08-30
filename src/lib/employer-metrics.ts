/**
 * CarpoolWork — employer dashboard data.
 * Server-side aggregation for the /employer portal. Reads the company and its
 * memberships, and derives the estimated annual impact from the shared impact
 * module. All figures a portal admin sees are computed here, never on the client.
 */
import { prisma } from '@/lib/db';
import {
  IMPACT,
  carsRemoved,
  litresSaved,
  emissionsKg,
  treesEquivalent,
  measuredImpact,
  type MeasuredImpact,
} from '@/lib/impact';

export type EmployerMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  role: 'MEMBER' | 'EMPLOYER_ADMIN';
  status: 'INVITED' | 'ACTIVE' | 'REMOVED';
  joinedAt: string; // ISO
};

export type EmployerDashboardData = {
  company: {
    id: string;
    name: string;
    region: string | null;
    parkingCostYear: number;
    avgCommuteKm: number;
  };
  counts: { total: number; active: number; invited: number };
  /**
   * Estimated annual potential if every ACTIVE member carpools their commute.
   * Clearly a projection until real trip data is linked to the company.
   */
  projection: {
    participants: number;
    carsRemoved: number;
    litresYear: number;
    co2KgYear: number;
    trees: number;
    parkingYear: number;
  };
  /**
   * Impact actually measured from recorded carpools during the current month.
   * `activeParticipants` is the billing basis: distinct members with at least
   * one carpool logged this month.
   */
  measured: MeasuredImpact & {
    activeParticipants: number;
    monthStartIso: string;
    allTimeCarpools: number;
  };
  members: EmployerMember[];
};

/**
 * Build the dashboard payload for a company. Only ever called after
 * requireCompanyAdmin() has confirmed the caller administers this company,
 * so the tables are guaranteed to exist by this point.
 */
export async function getEmployerDashboard(companyId: string): Promise<EmployerDashboardData | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      region: true,
      parkingCostYear: true,
      avgCommuteKm: true,
    },
  });
  if (!company) return null;

  const memberships = await prisma.companyMembership.findMany({
    where: { companyId, status: { not: 'REMOVED' } },
    select: {
      id: true,
      role: true,
      status: true,
      department: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
  });

  const members: EmployerMember[] = memberships.map((m) => ({
    id: m.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    email: m.user.email,
    department: m.department,
    role: m.role,
    status: m.status,
    joinedAt: m.createdAt.toISOString(),
  }));

  const active = members.filter((m) => m.status === 'ACTIVE').length;
  const invited = members.filter((m) => m.status === 'INVITED').length;

  // Estimated annual potential from active participants.
  const participants = active;
  const cars = carsRemoved(participants);
  const annualKmPerParticipant = company.avgCommuteKm * 2 * IMPACT.WORKING_DAYS_YEAR; // round trip × working days
  const litresYear = litresSaved(cars, annualKmPerParticipant);
  const co2KgYear = emissionsKg(litresYear);
  const trees = treesEquivalent(co2KgYear);
  const parkingYear = cars * company.parkingCostYear; // each car removed frees ~1 place

  // Measured impact — from carpools actually recorded this month.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthLogs, monthParticipants, allTimeCarpools] = await Promise.all([
    prisma.carpoolLog.count({ where: { companyId, date: { gte: monthStart } } }),
    prisma.carpoolLog.groupBy({
      by: ['membershipId'],
      where: { companyId, date: { gte: monthStart } },
    }),
    prisma.carpoolLog.count({ where: { companyId } }),
  ]);

  const measured = {
    ...measuredImpact(monthLogs, company.avgCommuteKm),
    activeParticipants: monthParticipants.length,
    monthStartIso: monthStart.toISOString(),
    allTimeCarpools,
  };

  return {
    company,
    counts: { total: members.length, active, invited },
    projection: {
      participants,
      carsRemoved: cars,
      litresYear,
      co2KgYear,
      trees,
      parkingYear,
    },
    measured,
    members,
  };
}
