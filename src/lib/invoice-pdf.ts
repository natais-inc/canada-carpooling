/**
 * CarpoolWork — invoice PDF (pdf-lib, bilingual, one page).
 * Standard PDF fonts (WinAnsi) — accented Latin letters are fine; avoid ₂/≈.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BRAND = rgb(0x25 / 255, 0x77 / 255, 0xeb / 255);
const INK = rgb(0.11, 0.12, 0.15);
const MUTE = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.85, 0.87, 0.9);
const PANEL = rgb(0.965, 0.975, 0.995);

export type InvoiceData = {
  number: string;
  periodYear: number;
  periodMonth: number; // 1-12
  activeParticipants: number;
  pricePerParticipantCents: number;
  amountCents: number;
  currency: string;
  status: 'DUE' | 'PAID' | 'VOID' | 'TRIAL';
  issuedAt: string; // ISO
  paidAt: string | null;
  company: { name: string; region: string | null };
};

const STR = {
  fr: {
    invoice: 'Facture',
    vendor: 'NATAIS Inc.',
    vendorFull: 'North American Technologies and AI Solutions Inc.',
    billedTo: 'Facturé à',
    number: 'No de facture',
    issued: 'Date d\'émission',
    period: 'Période facturée',
    lineDesc: 'Description',
    qty: 'Qté',
    unit: 'Prix unitaire',
    amount: 'Montant',
    lineItem: 'Participants actifs au covoiturage',
    perMonth: '/ participant / mois',
    total: 'Total',
    status_DUE: 'À payer',
    status_PAID: 'Payée',
    status_VOID: 'Annulée',
    status_TRIAL: 'Offerte (essai gratuit)',
    paidOn: (d: string) => `Payée le ${d}`,
    trialNote: 'Cette période est couverte par l\'essai gratuit de 30 jours — aucun montant n\'est dû.',
    methodNote: 'Facturation rétrospective : un participant actif est un employé ayant enregistré au moins un covoiturage durant le mois facturé.',
    footer: 'CarpoolWork — carpoolwork.ca — une solution de NATAIS Inc.',
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  },
  en: {
    invoice: 'Invoice',
    vendor: 'NATAIS Inc.',
    vendorFull: 'North American Technologies and AI Solutions Inc.',
    billedTo: 'Billed to',
    number: 'Invoice no.',
    issued: 'Issue date',
    period: 'Billing period',
    lineDesc: 'Description',
    qty: 'Qty',
    unit: 'Unit price',
    amount: 'Amount',
    lineItem: 'Active carpool participants',
    perMonth: '/ participant / month',
    total: 'Total',
    status_DUE: 'Due',
    status_PAID: 'Paid',
    status_VOID: 'Void',
    status_TRIAL: 'Free (trial)',
    paidOn: (d: string) => `Paid on ${d}`,
    trialNote: 'This period is covered by the 30-day free trial — nothing is due.',
    methodNote: 'Retrospective billing: an active participant is an employee who logged at least one carpool during the billed month.',
    footer: 'CarpoolWork — carpoolwork.ca — a NATAIS Inc. solution',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
} as const;

export async function buildInvoicePdf(inv: InvoiceData, locale: 'fr' | 'en'): Promise<Uint8Array> {
  const t = STR[locale];
  const loc = locale === 'en' ? 'en-CA' : 'fr-CA';
  const money = (cents: number) =>
    new Intl.NumberFormat(loc, { style: 'currency', currency: inv.currency || 'CAD', minimumFractionDigits: 2 }).format(cents / 100);
  const dateFmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(loc, { dateStyle: 'long' });
    } catch {
      return iso;
    }
  };

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28;
  const M = 56;
  let y = 785;

  const text = (s: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color });
  const right = (s: string, xRight: number, yy: number, size: number, f = font, color = INK) => {
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: xRight - w, y: yy, size, font: f, color });
  };

  // Header
  text('CarpoolWork', M, y, 22, bold, BRAND);
  right(t.invoice.toUpperCase(), W - M, y + 2, 16, bold, MUTE);
  y -= 18;
  text(`${t.vendor} — ${t.vendorFull}`, M, y, 9, font, MUTE);
  y -= 30;

  // Meta panel (number / issued / period / status)
  const panelH = 74;
  page.drawRectangle({ x: M, y: y - panelH, width: W - 2 * M, height: panelH, color: PANEL, borderColor: LINE, borderWidth: 1 });
  const periodLabel = `${t.months[inv.periodMonth - 1]} ${inv.periodYear}`;
  const colA = M + 16;
  const colB = M + (W - 2 * M) / 2 + 8;
  let py = y - 20;
  text(t.number, colA, py, 8, bold, MUTE); text(inv.number, colA, py - 13, 11, font, INK);
  text(t.period, colB, py, 8, bold, MUTE); text(periodLabel, colB, py - 13, 11, font, INK);
  py -= 36;
  text(t.issued, colA, py, 8, bold, MUTE); text(dateFmt(inv.issuedAt), colA, py - 13, 11, font, INK);
  const statusLabel = (t as any)[`status_${inv.status}`] as string;
  const statusColor = inv.status === 'PAID' ? rgb(0.13, 0.55, 0.29) : inv.status === 'DUE' ? BRAND : MUTE;
  text('Statut / Status', colB, py, 8, bold, MUTE); text(statusLabel, colB, py - 13, 11, bold, statusColor);
  y -= panelH + 26;

  // Billed to
  text(t.billedTo, M, y, 9, bold, MUTE);
  y -= 16;
  text(inv.company.name, M, y, 13, bold, INK);
  if (inv.company.region) { y -= 15; text(inv.company.region, M, y, 10, font, MUTE); }
  y -= 30;

  // Line item table
  const tableTop = y;
  const cQty = W - M - 210;
  const cUnit = W - M - 120;
  const cAmt = W - M;
  text(t.lineDesc, M, tableTop, 8, bold, MUTE);
  right(t.qty, cQty + 20, tableTop, 8, bold, MUTE);
  right(t.unit, cUnit + 40, tableTop, 8, bold, MUTE);
  right(t.amount, cAmt, tableTop, 8, bold, MUTE);
  y = tableTop - 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 22;
  text(t.lineItem, M, y, 11, font, INK);
  text(`${periodLabel}`, M, y - 14, 9, font, MUTE);
  right(`${inv.activeParticipants}`, cQty + 20, y, 11, font, INK);
  right(`${money(inv.pricePerParticipantCents)} ${t.perMonth}`, cUnit + 40, y, 9, font, MUTE);
  right(money(inv.amountCents), cAmt, y, 11, font, INK);
  y -= 30;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 26;

  // Total
  right(t.total, cUnit + 40, y, 12, bold, INK);
  right(money(inv.amountCents), cAmt, y, 15, bold, inv.status === 'PAID' ? rgb(0.13, 0.55, 0.29) : BRAND);
  y -= 12;
  if (inv.status === 'PAID' && inv.paidAt) {
    y -= 12; right(t.paidOn(dateFmt(inv.paidAt)), cAmt, y, 9, font, MUTE);
  }
  y -= 30;

  // Notes
  if (inv.status === 'TRIAL') {
    text(t.trialNote, M, y, 9, font, MUTE); y -= 16;
  }
  text(t.methodNote, M, y, 9, font, MUTE);

  // Footer
  text(t.footer, M, 40, 8, font, MUTE);

  return doc.save();
}
