/**
 * CarpoolWork — employer impact report (PDF).
 * Builds a one-page, branded, bilingual emissions/impact report from the same
 * dashboard data and the shared impact assumptions. Uses pdf-lib (pure JS,
 * standard fonts) so it runs reliably in Vercel's serverless runtime.
 *
 * Note: standard PDF fonts use WinAnsi encoding — accented Latin letters are
 * fine, but characters like "₂" or "≈" are not, so the text uses "CO2" and
 * plain ASCII symbols on purpose.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { EmployerDashboardData } from '@/lib/employer-metrics';
import { IMPACT } from '@/lib/impact';

const BRAND = rgb(0x25 / 255, 0x77 / 255, 0xeb / 255);
const INK = rgb(0.11, 0.12, 0.15);
const MUTE = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.85, 0.87, 0.9);
const PANEL = rgb(0.965, 0.975, 0.995);

type Strings = {
  brand: string;
  title: string;
  generated: (d: string) => string;
  participation: string;
  activeMembers: (n: string) => string;
  impactTitle: string;
  carsRemoved: string;
  co2Avoided: string;
  trees: string;
  fuel: string;
  parking: string;
  perYear: string;
  methodTitle: string;
  method: (a: { km: string; occ: string; cons: string; days: string }) => string[];
  disclaimer: (n: string) => string;
  footer: string;
};

const STR: Record<'fr' | 'en', Strings> = {
  fr: {
    brand: 'CarpoolWork',
    title: 'Rapport d\'impact — covoiturage domicile-travail',
    generated: (d) => `Généré le ${d}`,
    participation: 'Participation',
    activeMembers: (n) => `${n} employés participants (membres actifs)`,
    impactTitle: 'Impact annuel estimé',
    carsRemoved: 'Voitures retirées de la route',
    co2Avoided: 'CO2 évité',
    trees: 'Équivalent en arbres',
    fuel: 'Carburant économisé',
    parking: 'Coût de stationnement évité',
    perYear: '/ an',
    methodTitle: 'Méthodologie et hypothèses',
    method: (a) => [
      `Trajet moyen : ${a.km} km aller-retour, ${a.days} jours ouvrables par an.`,
      `Taux d'occupation moyen : ${a.occ} personnes par voiture ; consommation : ${a.cons} L / 100 km.`,
      'Facteur d\'émission essence : 2,31 kg de CO2 par litre. Arbre : 21 kg de CO2 absorbé par an.',
    ],
    disclaimer: (n) =>
      `Projection annuelle fondée sur ${n} membres actifs supposés covoiturer leur trajet. ` +
      'Les chiffres réels remplaceront cette estimation à mesure que les trajets sont enregistrés.',
    footer: 'Produit par CarpoolWork · carpoolwork.ca',
  },
  en: {
    brand: 'CarpoolWork',
    title: 'Impact report — commuter carpooling',
    generated: (d) => `Generated on ${d}`,
    participation: 'Participation',
    activeMembers: (n) => `${n} participating employees (active members)`,
    impactTitle: 'Estimated annual impact',
    carsRemoved: 'Cars taken off the road',
    co2Avoided: 'CO2 avoided',
    trees: 'Tree equivalent',
    fuel: 'Fuel saved',
    parking: 'Parking cost avoided',
    perYear: '/ year',
    methodTitle: 'Methodology and assumptions',
    method: (a) => [
      `Average commute: ${a.km} km round trip, ${a.days} working days per year.`,
      `Average occupancy: ${a.occ} people per car; fuel use: ${a.cons} L / 100 km.`,
      'Gasoline emission factor: 2.31 kg CO2 per litre. Tree: 21 kg CO2 absorbed per year.',
    ],
    disclaimer: (n) =>
      `Annual projection based on ${n} active members assumed to carpool their commute. ` +
      'Real figures will replace this estimate as trips are recorded.',
    footer: 'Produced by CarpoolWork · carpoolwork.ca',
  },
};

export async function buildEmployerReport(
  data: EmployerDashboardData,
  locale: string
): Promise<Uint8Array> {
  const lang = locale === 'en' ? 'en' : 'fr';
  const s = STR[lang];
  const loc = lang === 'en' ? 'en-CA' : 'fr-CA';
  const int = (n: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(Math.round(n));
  const dec1 = (n: number) => new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  const money = (n: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const today = new Date().toLocaleDateString(loc, { dateStyle: 'long' });

  const doc = await PDFDocument.create();
  doc.setTitle(`${s.title} — ${data.company.name}`);
  doc.setAuthor('CarpoolWork');
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const M = 54;
  const RIGHT = 612 - M;
  let y = 792 - 60;

  const text = (str: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(str, { x, y: yy, size, font: f, color });
  const textRight = (str: string, xRight: number, yy: number, size: number, f = font, color = INK) => {
    const w = f.widthOfTextAtSize(str, size);
    page.drawText(str, { x: xRight - w, y: yy, size, font: f, color });
  };

  // Brand + title
  text(s.brand, M, y, 20, bold, BRAND);
  textRight(s.generated(today), RIGHT, y + 4, 9, font, MUTE);
  y -= 30;
  text(s.title, M, y, 15, bold, INK);
  y -= 18;
  text(`${data.company.name}${data.company.region ? ' · ' + data.company.region : ''}`, M, y, 11, font, MUTE);
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: RIGHT, y }, thickness: 1, color: LINE });
  y -= 26;

  // Participation
  text(s.participation, M, y, 12, bold, INK);
  y -= 18;
  text(s.activeMembers(int(data.counts.active)), M, y, 11, font, INK);
  y -= 30;

  // Impact panel
  text(s.impactTitle, M, y, 12, bold, INK);
  y -= 14;
  const rows: Array<[string, string]> = [
    [s.carsRemoved, dec1(data.projection.carsRemoved)],
    [s.co2Avoided, `${int(data.projection.co2KgYear)} kg ${s.perYear}`],
    [s.trees, int(data.projection.trees)],
    [s.fuel, `${int(data.projection.litresYear)} L ${s.perYear}`],
    [s.parking, `${money(data.projection.parkingYear)} ${s.perYear}`],
  ];
  const rowH = 30;
  const panelTop = y;
  const panelH = rows.length * rowH + 8;
  page.drawRectangle({ x: M, y: panelTop - panelH, width: RIGHT - M, height: panelH, color: PANEL, borderColor: LINE, borderWidth: 1 });
  let ry = panelTop - 4;
  rows.forEach(([label, value], i) => {
    const cy = ry - rowH + 10;
    text(label, M + 16, cy, 11, font, INK);
    textRight(value, RIGHT - 16, cy, 12, bold, BRAND);
    if (i < rows.length - 1) {
      page.drawLine({ start: { x: M + 12, y: ry - rowH }, end: { x: RIGHT - 12, y: ry - rowH }, thickness: 0.5, color: LINE });
    }
    ry -= rowH;
  });
  y = panelTop - panelH - 28;

  // Methodology
  text(s.methodTitle, M, y, 11, bold, INK);
  y -= 16;
  const method = s.method({
    km: int(data.company.avgCommuteKm * 2),
    occ: (lang === 'en' ? IMPACT.OCCUPANCY.toString() : IMPACT.OCCUPANCY.toString().replace('.', ',')),
    cons: (lang === 'en' ? IMPACT.L_PER_100KM.toString() : IMPACT.L_PER_100KM.toString().replace('.', ',')),
    days: int(IMPACT.WORKING_DAYS_YEAR),
  });
  method.forEach((line) => {
    text(`•  ${line}`, M, y, 9.5, font, MUTE);
    y -= 14;
  });
  y -= 10;

  // Disclaimer
  const disc = s.disclaimer(int(data.counts.active));
  wrapText(disc, RIGHT - M - 4).forEach((line) => {
    text(line, M, y, 9, font, MUTE);
    y -= 12;
  });

  // Footer
  page.drawLine({ start: { x: M, y: 60 }, end: { x: RIGHT, y: 60 }, thickness: 0.5, color: LINE });
  text(s.footer, M, 46, 9, font, MUTE);

  return doc.save();

  // naive word wrap using average char width
  function wrapText(str: string, maxWidth: number, size = 9): string[] {
    const words = str.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}
