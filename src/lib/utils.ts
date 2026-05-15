import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price);
}

export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${suffix}`;
}

// Full pricing logic is in src/lib/pricing.ts (server-side with province-specific taxes).
// These simplified client-side helpers are for display estimates only.
export function calculateServiceFee(pricePerSeat: number): number {
  // Flat 1 CAD fee per passenger per trip (before tax)
  return 1.0;
}

export function calculateDriverPayout(pricePerSeat: number): number {
  // Driver receives full seat price — service fee is charged to passenger on top
  return pricePerSeat;
}

export function getInitials(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  // If only one argument, split on space
  const parts = firstName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) || '';
  const last = parts[1]?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
}

export const CANADIAN_CITIES = [
  'Montréal, QC', 'Toronto, ON', 'Vancouver, BC', 'Calgary, AB', 'Edmonton, AB',
  'Ottawa, ON', 'Winnipeg, MB', 'Québec City, QC', 'Hamilton, ON', 'Kitchener, ON',
  'London, ON', 'Halifax, NS', 'Victoria, BC', 'Saskatoon, SK', 'Regina, SK',
  "St. John's, NL", 'Sherbrooke, QC', 'Trois-Rivières, QC', 'Gatineau, QC',
  'Moncton, NB', 'Fredericton, NB', 'Charlottetown, PE', 'Whitehorse, YT',
  'Yellowknife, NT', 'Kingston, ON', 'Thunder Bay, ON', 'Sudbury, ON',
];

export function getStarRating(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}
