import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, DeliveryNote, Letter, Profile, Customer, Receipt } from '../types';
import { formatCurrency, formatDate } from './helpers';

// ── Translation table ─────────────────────────────────────────────────────────
type Lang = 'de' | 'en';

const T: Record<Lang, {
  invoice: string;
  nr: string;
  datum: string;
  servicePeriod: string;
  dueDate: string;
  description: string;
  unitPrice: string;
  vat: string;
  netAmount: string;
  totalAmount: string;
  vatLabel: (rate: number) => string;
  from: string;
  to: string;
}> = {
  de: {
    invoice:       'Rechnung',
    nr:            'Rechnungs-Nr.',
    datum:         'Datum',
    servicePeriod: 'Leistungszeitraum',
    dueDate:       'Fällig bis',
    description:   'Beschreibung',
    unitPrice:     'Einzelpreis',
    vat:           'MwSt.',
    netAmount:     'Nettobetrag',
    totalAmount:   'Gesamtbetrag',
    vatLabel:      (rate) => `MwSt. ${rate}%:`,
    from:          'VON',
    to:            'AN',
  },
  en: {
    invoice:       'Invoice',
    nr:            'Invoice No.',
    datum:         'Date',
    servicePeriod: 'Service Period',
    dueDate:       'Due Date',
    description:   'Description',
    unitPrice:     'Unit Price',
    vat:           'VAT',
    netAmount:     'Net Amount',
    totalAmount:   'Total Amount',
    vatLabel:      (rate) => `VAT ${rate}%:`,
    from:          'FROM',
    to:            'TO',
  },
};

// ── Color palette ────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const NAVY: RGB       = [26,  35,  64];   // dark navy
const GOLD: RGB       = [212, 160,  23];  // gold text / labels
const GOLD_BG: RGB    = [240, 192,  48];  // gold highlight background
const SLATE_900: RGB  = [15,  23,  42];
const SLATE_700: RGB  = [51,  65,  85];
const SLATE_500: RGB  = [100, 116, 139];
const SLATE_300: RGB  = [203, 213, 225];
const SLATE_100: RGB  = [241, 245, 249];
const WHITE: RGB      = [255, 255, 255];

// ── Layout constants ─────────────────────────────────────────────────────────
const PAGE_W   = 210;
const PAGE_H   = 297;
const ML       = 14;   // margin left
const MR       = 14;   // margin right
const BODY_W   = PAGE_W - ML - MR; // 182 mm

// ── Low-level helpers ────────────────────────────────────────────────────────
const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const draw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const txt  = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

// ── Address helpers ───────────────────────────────────────────────────────────
function profileAddressLines(profile: Profile): string[] {
  return [
    profile.companyName || profile.internalName,
    profile.personName || '',
    profile.address || '',
    [profile.zipCode, profile.city].filter(Boolean).join(' '),
    profile.email || '',
    profile.phone || profile.mobile || '',
  ].filter(Boolean);
}

function customerAddressLines(customer: Customer): string[] {
  return [
    customer.companyName,
    customer.contactPerson || '',
    customer.address || '',
    [customer.zipCode, customer.city].filter(Boolean).join(' '),
    customer.country && customer.country !== 'Deutschland' ? customer.country : '',
  ].filter(Boolean);
}

// ── Modern header: gold strip + navy bar ─────────────────────────────────────
function drawModernHeader(
  doc: jsPDF,
  profile: Profile,
  numLabel: string,
  numValue: string,
  dateValue: string,
): number {
  // Gold accent strip (3 mm)
  fill(doc, GOLD_BG);
  draw(doc, GOLD_BG);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // Navy header bar (38 mm)
  fill(doc, NAVY);
  draw(doc, NAVY);
  doc.rect(0, 3, PAGE_W, 38, 'F');

  // Logo (top-left inside navy bar)
  let nameX = ML;
  if (profile.logo && profile.logoOnPdf !== false) {
    try {
      const imgType = profile.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(profile.logo, imgType, ML, 7, 28, 12);
      nameX = ML + 32;
    } catch { /* skip invalid logo */ }
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  txt(doc, WHITE);
  doc.text(profile.companyName || profile.internalName, nameX, 17);

  if (profile.personName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    txt(doc, GOLD_BG);
    doc.text(profile.personName, nameX, 23);
  }

  // Small contact lines under name
  const contactLines = [
    [profile.address, [profile.zipCode, profile.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    profile.email,
    profile.phone || profile.mobile,
  ].filter(Boolean) as string[];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  txt(doc, SLATE_300);
  contactLines.forEach((line, i) => {
    doc.text(line, nameX, 28 + i * 4);
  });

  // Document number + date (right side of navy bar)
  const rightX = PAGE_W - MR;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  txt(doc, GOLD_BG);
  doc.text(numLabel, rightX, 20, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  txt(doc, WHITE);
  doc.text(numValue, rightX, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  txt(doc, SLATE_300);
  doc.text(dateValue, rightX, 33, { align: 'right' });

  return 41; // y after header
}

// ── Document title with gold underline ───────────────────────────────────────
function drawDocTitle(doc: jsPDF, title: string, y: number, fontSize = 22): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  txt(doc, NAVY);
  doc.text(title, ML, y);

  // Gold underline rect
  fill(doc, GOLD);
  doc.rect(ML, y + 2, BODY_W, 0.8, 'F');

  return y + 10;
}

// ── FROM / TO two-column section ─────────────────────────────────────────────
function drawFromTo(
  doc: jsPDF,
  fromLabel: string,
  fromLines: string[],
  toLabel: string,
  toLines: string[],
  y: number,
): number {
  const colW = BODY_W / 2 - 4;

  // FROM column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  txt(doc, GOLD);
  doc.text(fromLabel, ML, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  txt(doc, SLATE_700);
  fromLines.forEach((line, i) => {
    doc.text(line, ML, y + 5 + i * 5);
  });

  // TO column
  const toX = ML + colW + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  txt(doc, GOLD);
  doc.text(toLabel, toX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  txt(doc, SLATE_900);
  toLines.forEach((line, i) => {
    doc.text(line, toX, y + 5 + i * 5);
  });

  const maxLines = Math.max(fromLines.length, toLines.length);
  return y + 5 + maxLines * 5 + 6;
}

// ── Totals box ────────────────────────────────────────────────────────────────
function drawModernTotals(
  doc: jsPDF,
  netTotal: number,
  vatTotals: { rate: number; amount: number }[],
  grossTotal: number,
  startY: number,
  lang: Lang = 'de',
): number {
  const boxX = ML + BODY_W * 0.45;
  const boxW = PAGE_W - MR - boxX;
  const rowH = 7;
  const rows = 1 + vatTotals.length; // net + vat rows
  const innerH = rows * rowH;
  const totalH = 9;
  const boxH = innerH + 2 + totalH;

  // Background for inner rows
  fill(doc, SLATE_100);
  draw(doc, SLATE_300);
  doc.setLineWidth(0.2);
  doc.roundedRect(boxX, startY, boxW, innerH + 2, 2, 2, 'FD');

  let ty = startY + rowH - 1;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  txt(doc, SLATE_700);

  doc.text(`${T[lang].netAmount}:`, boxX + 3, ty);
  doc.text(formatCurrency(netTotal), PAGE_W - MR - 3, ty, { align: 'right' });
  ty += rowH;

  vatTotals.forEach((vt) => {
    doc.text(T[lang].vatLabel(vt.rate), boxX + 3, ty);
    doc.text(formatCurrency(vt.amount), PAGE_W - MR - 3, ty, { align: 'right' });
    ty += rowH;
  });

  // Gold total row
  fill(doc, GOLD_BG);
  draw(doc, GOLD_BG);
  doc.roundedRect(boxX, startY + innerH + 2, boxW, totalH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  txt(doc, NAVY);
  doc.text(`${T[lang].totalAmount}:`, boxX + 3, startY + innerH + 2 + totalH - 2);
  doc.text(formatCurrency(grossTotal), PAGE_W - MR - 3, startY + innerH + 2 + totalH - 2, { align: 'right' });

  return startY + boxH + 10;
}

// ── Text block (notes / payment) ──────────────────────────────────────────────
function drawTextBlock(doc: jsPDF, label: string, content: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  txt(doc, GOLD);
  doc.text(label.toUpperCase(), ML, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  txt(doc, SLATE_700);
  const lines = doc.splitTextToSize(content, BODY_W);
  doc.text(lines, ML, y);
  return y + lines.length * 5 + 6;
}

// ── Signature ─────────────────────────────────────────────────────────────────
function drawSignature(doc: jsPDF, profile: Profile, y: number): number {
  if (!profile.signature) return y;
  try {
    const imgType = profile.signature.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(profile.signature, imgType, ML, y, 60, 20);
    draw(doc, SLATE_300);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 22, ML + 60, y + 22);
  } catch { /* skip if image invalid */ }
  return y + 22;
}

// ── Modern footer: navy bar ───────────────────────────────────────────────────
function drawModernFooter(doc: jsPDF, profile: Profile): void {
  const footerY = PAGE_H - 18;

  // Gold accent line above footer
  fill(doc, GOLD);
  doc.rect(0, footerY - 1, PAGE_W, 0.8, 'F');

  // Navy footer bar
  fill(doc, NAVY);
  draw(doc, NAVY);
  doc.rect(0, footerY, PAGE_W, 18, 'F');

  const parts: string[] = [];
  if (profile.iban)      parts.push(`IBAN: ${profile.iban}`);
  if (profile.bic)       parts.push(`BIC: ${profile.bic}`);
  if (profile.bankName)  parts.push(profile.bankName);
  if (profile.vatId)     parts.push(`USt-IdNr.: ${profile.vatId}`);
  if (profile.taxNumber) parts.push(`St-Nr.: ${profile.taxNumber}`);
  if (profile.website)   parts.push(profile.website);

  const footerText = profile.pdfFooter || parts.join('  ·  ');

  if (footerText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    txt(doc, SLATE_300);
    const lines = doc.splitTextToSize(footerText, BODY_W);
    doc.text(lines, PAGE_W / 2, footerY + 6, { align: 'center' });
  }

}

// ── Invoice builder ───────────────────────────────────────────────────────────
function buildInvoiceDoc(
  invoice: Invoice,
  profile: Profile,
  customer: Customer | null,
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const lang: Lang = invoice.language || 'de';

  let y = drawModernHeader(
    doc, profile,
    T[lang].nr, invoice.invoiceNumber,
    formatDate(invoice.invoiceDate),
  );

  y = drawDocTitle(doc, T[lang].invoice, y + 14);

  // FROM / TO
  const fromLines = profileAddressLines(profile);
  const toLines = customer ? customerAddressLines(customer) : [];
  if (toLines.length > 0) {
    y = drawFromTo(doc, T[lang].from, fromLines, T[lang].to, toLines, y + 2);
  } else {
    y += 4;
  }

  // Extra meta (service period, due date)
  const metaItems: string[] = [];
  if (invoice.servicePeriod) metaItems.push(`${T[lang].servicePeriod}: ${invoice.servicePeriod}`);
  if (invoice.dueDate)       metaItems.push(`${T[lang].dueDate}: ${formatDate(invoice.dueDate)}`);
  if (metaItems.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    txt(doc, SLATE_500);
    doc.text(metaItems.join('   '), ML, y);
    y += 7;
  }

  // Intro text
  if (invoice.introText) {
    y = drawTextBlock(doc, '', invoice.introText, y) - 5;
  }

  // Items table
  const tableBody = invoice.items.map((item, idx) => [
    String(idx + 1),
    item.description,
    formatCurrency(item.netUnitPrice),
    `${item.vatRate} %`,
    formatCurrency(item.netTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', T[lang].description, T[lang].unitPrice, T[lang].vat, T[lang].netAmount]],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: SLATE_100 },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: SLATE_700,
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: ML, right: MR },
    tableLineColor: SLATE_300,
    tableLineWidth: 0.2,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  y = drawModernTotals(doc, invoice.netTotal, invoice.vatTotals, invoice.grossTotal, y, lang);

  // Payment text
  if (invoice.paymentText) {
    y = drawTextBlock(doc, 'Zahlungshinweis', invoice.paymentText, y);
  }

  // Signature
  if (profile.signatureOnInvoice && profile.signature) {
    drawSignature(doc, profile, y - 9);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ── Delivery note builder ─────────────────────────────────────────────────────
function buildDeliveryNoteDoc(
  note: DeliveryNote,
  profile: Profile,
  customer: Customer | null,
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawModernHeader(
    doc, profile,
    'Lieferschein-Nr.', note.deliveryNoteNumber,
    formatDate(note.deliveryDate),
  );

  y = drawDocTitle(doc, 'Lieferschein / Rechnung', y + 24);

  const fromLines = profileAddressLines(profile);
  const toLines = customer ? customerAddressLines(customer) : [];
  if (toLines.length > 0) {
    y = drawFromTo(doc, 'VON', fromLines, 'AN', toLines, y + 2);
  } else {
    y += 4;
  }

  if (note.introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    txt(doc, SLATE_700);
    doc.setLineHeightFactor(1.5);
    const introLines = doc.splitTextToSize(note.introText, BODY_W);
    doc.text(introLines, ML, y);
    doc.setLineHeightFactor(1.15);
    y += introLines.length * 7 + 1;
  }

  const hasPrices = note.items.some((item) => (item.netUnitPrice ?? 0) > 0);

  if (hasPrices) {
    const tableBody = note.items.map((item, idx) => [
      String(idx + 1),
      item.description + (item.notes ? `\n${item.notes}` : ''),
      item.quantity.toString(),
      item.unit,
      formatCurrency(item.netUnitPrice ?? 0),
      `${item.vatRate ?? 0} %`,
      formatCurrency(item.netTotal ?? 0),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Artikel / Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'MwSt.', 'Nettobetrag']],
      body: tableBody,
      theme: 'plain',
      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: SLATE_100 },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: SLATE_700,
      },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 18 },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: ML, right: MR },
      tableLineColor: SLATE_300,
      tableLineWidth: 0.2,
    });
  } else {
    const tableBody = note.items.map((item, idx) => [
      String(idx + 1),
      item.description,
      item.quantity.toString(),
      item.unit,
      item.notes || '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Artikel / Beschreibung', 'Menge', 'Einheit', 'Bemerkung']],
      body: tableBody,
      theme: 'plain',
      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: SLATE_100 },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: SLATE_700,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 22 },
      },
      margin: { left: ML, right: MR },
      tableLineColor: SLATE_300,
      tableLineWidth: 0.2,
    });
  }

  y = (doc as any).lastAutoTable.finalY + 8;

  if (hasPrices) {
    y = drawModernTotals(doc, note.netTotal ?? 0, note.vatTotals ?? [], note.grossTotal ?? 0, y);
  }

  if (note.noteText) {
    y = drawTextBlock(doc, 'Bemerkung', note.noteText, y);
  }

  if (profile.signatureOnDeliveryNote && profile.signature) {
    drawSignature(doc, profile, y + 6);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ── Letter builder ────────────────────────────────────────────────────────────
function buildLetterDoc(
  letter: Letter,
  profile: Profile,
  customer: Customer | null,
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawModernHeader(
    doc, profile,
    'Datum', formatDate(letter.letterDate),
    '',
  );

  y = drawDocTitle(doc, letter.title, y + 24, 17);

  if (customer) {
    const fromLines = profileAddressLines(profile);
    const toLines = customerAddressLines(customer);
    y = drawFromTo(doc, 'VON', fromLines, 'AN', toLines, y + 2);
  } else {
    y += 4;
  }

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  txt(doc, SLATE_700);
  doc.setLineHeightFactor(1.5);
  const bodyLines = doc.splitTextToSize(letter.content, BODY_W);
  doc.text(bodyLines, ML, y + 20);
  doc.setLineHeightFactor(1.15); // reset to default
  y += bodyLines.length * 7 + 28;

  if (profile.signatureOnLetter && profile.signature) {
    drawSignature(doc, profile, y - 13);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ── Receipt builder ───────────────────────────────────────────────────────────
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bar: 'Bar',
  überweisung: 'Überweisung',
  karte: 'Karte',
  sonstige: 'Sonstige',
};

function buildReceiptDoc(receipt: Receipt, profile: Profile): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawModernHeader(
    doc, profile,
    'Quittungs-Nr.', receipt.receiptNumber,
    formatDate(receipt.date),
  );

  y = drawDocTitle(doc, 'Quittung', y + 14);
  y += 4;

  const rows: [string, string][] = [
    ['Empfangen von', receipt.payerName || '–'],
    ['Verwendungszweck', receipt.purpose || '–'],
    ['Zahlungsart', PAYMENT_METHOD_LABEL[receipt.paymentMethod] || receipt.paymentMethod],
  ];
  if (receipt.notes) rows.push(['Bemerkung', receipt.notes]);

  rows.forEach(([label, value]) => {
    // Row with gold label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    txt(doc, GOLD);
    doc.text(label.toUpperCase(), ML, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    txt(doc, SLATE_900);
    const valLines = doc.splitTextToSize(value, BODY_W - 60);
    doc.text(valLines, ML + 55, y);

    // Thin separator
    fill(doc, SLATE_100);
    doc.rect(ML, y + 3, BODY_W, 0.3, 'F');
    y += Math.max(valLines.length * 5, 6) + 6;
  });

  y += 4;

  // Gold amount highlight box
  fill(doc, GOLD_BG);
  draw(doc, GOLD_BG);
  doc.roundedRect(ML, y, BODY_W, 16, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  txt(doc, NAVY);
  doc.text('BETRAG', ML + 6, y + 10);

  doc.setFontSize(16);
  txt(doc, NAVY);
  doc.text(formatCurrency(receipt.amount), PAGE_W - MR - 6, y + 10, { align: 'right' });
  y += 24;

  // Signature
  if (profile.signature) {
    drawSignature(doc, profile, y + 7);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  customer: Customer | null,
): void {
  buildInvoiceDoc(invoice, profile, customer).save(`${invoice.invoiceNumber}.pdf`);
}

export function getInvoicePdfBlob(
  invoice: Invoice,
  profile: Profile,
  customer: Customer | null,
): Blob {
  return buildInvoiceDoc(invoice, profile, customer).output('blob');
}

export function generateDeliveryNotePDF(
  note: DeliveryNote,
  profile: Profile,
  customer: Customer | null,
): void {
  buildDeliveryNoteDoc(note, profile, customer).save(`${note.deliveryNoteNumber}.pdf`);
}

export function getDeliveryNotePdfBlob(
  dn: DeliveryNote,
  profile: Profile,
  customer: Customer | null,
): Blob {
  return buildDeliveryNoteDoc(dn, profile, customer).output('blob');
}

export function generateLetterPDF(
  letter: Letter,
  profile: Profile,
  customer: Customer | null,
): void {
  buildLetterDoc(letter, profile, customer).save(`${letter.title || 'Schreiben'}.pdf`);
}

export function getLetterPdfBlob(
  letter: Letter,
  profile: Profile,
  customer: Customer | null,
): Blob {
  return buildLetterDoc(letter, profile, customer).output('blob');
}

export function generateReceiptPDF(receipt: Receipt, profile: Profile): void {
  buildReceiptDoc(receipt, profile).save(`Quittung-${receipt.receiptNumber}.pdf`);
}

export function getReceiptPdfBlob(receipt: Receipt, profile: Profile): Blob {
  return buildReceiptDoc(receipt, profile).output('blob');
}

/** Share a PDF blob via Web Share API (mobile) or fallback to download + WhatsApp/Email modal trigger. */
export async function sharePdfBlob(
  blob: Blob,
  filename: string,
  title: string,
  fallback: (url: string) => void,
): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch { /* user cancelled or not supported */ }
  }
  // Fallback: create object URL and pass to caller for manual share options
  const url = URL.createObjectURL(blob);
  fallback(url);
}
