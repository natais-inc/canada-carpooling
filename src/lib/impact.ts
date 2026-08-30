/**
 * CarpoolWork — impact & savings calculations.
 * Single source of truth for emissions and parking figures, shared by the
 * employer portal, the PDF report, and the employee's personal impact view.
 */

export const IMPACT = {
  GAS_KG_PER_L: 2.31, // kg CO2 per litre of gasoline
  TREE_KG_YEAR: 21, // kg CO2 absorbed per tree per year (illustrative)
  L_PER_100KM: 8.5, // average car fuel consumption
  OCCUPANCY: 2.5, // average people per carpool
  WORKING_DAYS_YEAR: 260, // working days used to prorate annual parking cost
} as const;

/** Cars taken off the road for a given number of carpooling participants. */
export function carsRemoved(participants: number, occupancy: number = IMPACT.OCCUPANCY): number {
  if (occupancy <= 0) return 0;
  return participants * (1 - 1 / occupancy);
}

/** Litres of fuel avoided for `cars` over `km` travelled. */
export function litresSaved(cars: number, km: number): number {
  return cars * km * (IMPACT.L_PER_100KM / 100);
}

/** CO2 avoided (kg) for a volume of fuel not burned. */
export function emissionsKg(litres: number): number {
  return litres * IMPACT.GAS_KG_PER_L;
}

/** Tree-equivalent for a mass of CO2 (illustrative). */
export function treesEquivalent(kg: number): number {
  return kg / IMPACT.TREE_KG_YEAR;
}

/** Parking cost avoided for one working day. */
export function parkingSavedPerDay(cars: number, parkingCostYear: number): number {
  return cars * (parkingCostYear / IMPACT.WORKING_DAYS_YEAR);
}

export type MeasuredImpact = {
  carpoolDays: number; // number of recorded carpool days
  kmShared: number; // commute km covered by carpooling (round trips)
  carsRemoved: number; // cars-equivalent taken off the road
  litres: number; // fuel avoided
  co2Kg: number; // CO2 avoided
  trees: number; // tree-equivalent
};

/**
 * Impact actually *measured* from recorded carpool days, using the same
 * per-participant-per-day basis as the projection: one carpool day shares one
 * commuter's round trip, removing `carsRemoved(1)` cars for that trip. If every
 * active member logged all working days, this equals the annual projection.
 */
export function measuredImpact(carpoolDays: number, avgCommuteKm: number): MeasuredImpact {
  const roundTrip = Math.max(0, avgCommuteKm) * 2;
  const cars = carsRemoved(carpoolDays);
  const litres = litresSaved(cars, roundTrip);
  const co2Kg = emissionsKg(litres);
  return {
    carpoolDays,
    kmShared: carpoolDays * roundTrip,
    carsRemoved: cars,
    litres,
    co2Kg,
    trees: treesEquivalent(co2Kg),
  };
}
