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
}> = {
  de: {
    invoice:       'Rechnung',
    nr:            'Nummer',
    datum:         'Datum',
    servicePeriod: 'Leistungszeitraum',
    dueDate:       'Fällig bis',
    description:   'Beschreibung',
    unitPrice:     'Einzelpreis',
    vat:           'MwSt.',
    netAmount:     'Nettobetrag',
    totalAmount:   'Gesamtbetrag',
    vatLabel:      (rate) => `MwSt. ${rate}%`,
  },
  en: {
    invoice:       'Invoice',
    nr:            'Number',
    datum:         'Date',
    servicePeriod: 'Service Period',
    dueDate:       'Due Date',
    description:   'Description',
    unitPrice:     'Unit Price',
    vat:           'VAT',
    netAmount:     'Net Amount',
    totalAmount:   'Total Amount',
    vatLabel:      (rate) => `VAT ${rate}%`,
  },
};

// ── Color palette ─────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const NAVY: RGB     = [26,  35,  64];   // dark navy
const GOLD: RGB     = [212, 160,  23];  // gold label
const GOLD_BG: RGB  = [240, 192,  48];  // gold background (totals row)
const WHITE: RGB    = [255, 255, 255];
const SLATE_900: RGB = [15,  23,  42];
const SLATE_700: RGB = [51,  65,  85];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_200: RGB = [220, 226, 235];
const SLATE_50: RGB  = [248, 250, 252];

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_W = 210;
const ML = 14;
const MR = 14;
const BODY_W = PAGE_W - ML - MR; // 182 mm
const HEADER_H = 38;              // navy header height
const GOLD_STRIP = 3;             // gold strip at top

// ── Low-level helpers ─────────────────────────────────────────────────────────
const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const draw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const text = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

// ── Modern header (gold strip + navy bar) ────────────────────────────────────
function drawModernHeader(
  doc: jsPDF,
  profile: Profile,
  numLabel: string,
  numValue: string,
  dateValue: string,
): number {
  // Gold accent strip at very top
  fill(doc, GOLD_BG);
  doc.rect(0, 0, PAGE_W, GOLD_STRIP, 'F');

  // Navy header bar
  fill(doc, NAVY);
  doc.rect(0, GOLD_STRIP, PAGE_W, HEADER_H, 'F');

  // --- Left: logo + company ---
  let textY = GOLD_STRIP + 11;
  if (profile.logo) {
    try {
      const imgType = profile.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(profile.logo, imgType, ML, GOLD_STRIP + 5, 22, 12);
      textY = GOLD_STRIP + 11;
    } catch { /* skip */ }
  }

  const logoRightX = profile.logo ? ML + 26 : ML;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  text(doc, WHITE);
  doc.text(profile.companyName || profile.internalName, logoRightX, textY);

  if (profile.personName && profile.personName !== (profile.companyName || profile.internalName)) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    text(doc, [185, 195, 215] as RGB);
    doc.text(profile.personName, logoRightX, textY + 6);
  }

  const addrStr = [profile.address, `${profile.zipCode} ${profile.city}`.trim()]
    .filter(Boolean).join(', ');
  if (addrStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    text(doc, [160, 170, 195] as RGB);
    doc.text(addrStr, logoRightX, textY + 13);
  }

  // --- Right: number + date ---
  const rightX = PAGE_W - MR;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  text(doc, GOLD);
  doc.text(numLabel.toUpperCase(), rightX, GOLD_STRIP + 11, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  text(doc, WHITE);
  doc.text(numValue, rightX, GOLD_STRIP + 19, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  text(doc, GOLD);
  doc.text('DATUM', rightX, GOLD_STRIP + 28, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  text(doc, WHITE);
  doc.text(dateValue, rightX, GOLD_STRIP + 35, { align: 'right' });

  return GOLD_STRIP + HEADER_H + 8;
}

// ── Document title with gold underline ───────────────────────────────────────
function drawDocTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  text(doc, NAVY);
  doc.text(title.toUpperCase(), ML, y);

  // Gold underline bar
  fill(doc, GOLD_BG);
  doc.rect(ML, y + 2.5, 48, 1.5, 'F');

  return y + 12;
}

// ── Two-column FROM / TO section ─────────────────────────────────────────────
function drawFromTo(
  doc: jsPDF,
  fromLabel: string, fromLines: string[],
  toLabel: string,   toLines: string[],
  y: number
): number {
  const halfW = BODY_W / 2 - 4;
  const toX   = ML + halfW + 8;

  // FROM
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  text(doc, GOLD);
  doc.text(fromLabel.toUpperCase(), ML, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_700);
  fromLines.forEach((line, i) => doc.text(line, ML, y + 5 + i * 4.8));

  // TO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  text(doc, GOLD);
  doc.text(toLabel.toUpperCase(), toX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_700);
  toLines.forEach((line, i) => doc.text(line, toX, y + 5 + i * 4.8));

  const maxRows = Math.max(fromLines.length, toLines.length);
  return y + 5 + maxRows * 4.8 + 8;
}

// ── Modern totals box (right-aligned) ────────────────────────────────────────
function drawModernTotals(
  doc: jsPDF,
  netTotal: number,
  vatTotals: { rate: number; amount: number }[],
  grossTotal: number,
  y: number,
  lang: Lang = 'de',
): number {
  const boxW = 82;
  const boxX = PAGE_W - MR - boxW;
  const rowH = 7;
  const rows = 1 + vatTotals.length;  // netto + vat rows
  let cy = y;

  // Subtotal rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  fill(doc, SLATE_50);
  doc.rect(boxX, cy, boxW, rowH * rows, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  text(doc, SLATE_700);
  doc.text(lang === 'de' ? 'Nettobetrag' : 'Subtotal', boxX + 4, cy + 5);
  doc.text(formatCurrency(netTotal), PAGE_W - MR - 3, cy + 5, { align: 'right' });
  cy += rowH;

  vatTotals.forEach((vt) => {
    doc.text(T[lang].vatLabel(vt.rate), boxX + 4, cy + 5);
    doc.text(formatCurrency(vt.amount), PAGE_W - MR - 3, cy + 5, { align: 'right' });
    cy += rowH;
  });

  // TOTAL row with gold background
  fill(doc, GOLD_BG);
  doc.rect(boxX, cy, boxW, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  text(doc, NAVY);
  doc.text(T[lang].totalAmount.toUpperCase(), boxX + 4, cy + 7);
  doc.text(formatCurrency(grossTotal), PAGE_W - MR - 3, cy + 7, { align: 'right' });
  cy += 10;

  return cy + 10;
}

// ── Payment / notes text block ────────────────────────────────────────────────
function drawTextBlock(doc: jsPDF, label: string, content: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  text(doc, GOLD);
  doc.text(label.toUpperCase(), ML, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_700);
  const lines = doc.splitTextToSize(content, BODY_W);
  doc.text(lines, ML, y);
  return y + lines.length * 4.5 + 6;
}

// ── Signature ─────────────────────────────────────────────────────────────────
function drawSignature(doc: jsPDF, profile: Profile, y: number): number {
  if (!profile.signature) return y;
  try {
    const imgType = profile.signature.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(profile.signature, imgType, ML, y, 60, 20);
    draw(doc, SLATE_200);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 22, ML + 60, y + 22);
    text(doc, SLATE_500);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(profile.personName || profile.companyName || '', ML, y + 26);
  } catch { /* skip */ }
  return y + 30;
}

// ── Dark footer bar ───────────────────────────────────────────────────────────
function drawModernFooter(doc: jsPDF, profile: Profile): void {
  const pageH = doc.internal.pageSize.getHeight();
  const footH = 16;
  const footY = pageH - footH;

  // Gold accent line above footer
  fill(doc, GOLD_BG);
  doc.rect(0, footY - 1, PAGE_W, 1, 'F');

  // Navy footer bar
  fill(doc, NAVY);
  doc.rect(0, footY, PAGE_W, footH, 'F');

  // Contact items
  const items: string[] = [];
  if (profile.website) items.push(profile.website);
  if (profile.email)   items.push(profile.email);
  if (profile.phone || profile.mobile) items.push(profile.phone || profile.mobile);

  // Bank / tax info
  const bankParts: string[] = [];
  if (profile.iban)      bankParts.push(`IBAN: ${profile.iban}`);
  if (profile.bic)       bankParts.push(`BIC: ${profile.bic}`);
  if (profile.vatId)     bankParts.push(`USt-IdNr.: ${profile.vatId}`);
  if (profile.taxNumber) bankParts.push(`St-Nr.: ${profile.taxNumber}`);

  const footerText = profile.pdfFooter
    || [...items, ...bankParts].join('  ·  ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  text(doc, [190, 200, 220] as RGB);
  if (footerText) {
    const lines = doc.splitTextToSize(footerText, BODY_W);
    doc.text(lines[0], PAGE_W / 2, footY + 7, { align: 'center' });
    if (lines[1]) doc.text(lines[1], PAGE_W / 2, footY + 12, { align: 'center' });
  }
}

// ── Address helpers ───────────────────────────────────────────────────────────
function profileAddressLines(profile: Profile): string[] {
  return [
    profile.companyName || profile.internalName,
    profile.personName && profile.personName !== (profile.companyName || profile.internalName)
      ? profile.personName : '',
    profile.address,
    `${profile.zipCode} ${profile.city}`.trim(),
    profile.country && profile.country !== 'Deutschland' ? profile.country : '',
  ].filter(Boolean);
}

function customerAddressLines(c: Customer): string[] {
  return [
    c.companyName,
    c.contactPerson,
    c.address,
    `${c.zipCode} ${c.city}`.trim(),
    c.country && c.country !== 'Deutschland' ? c.country : '',
  ].filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── INVOICE PDF ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export function generateInvoicePDF(invoice: Invoice, profile: Profile, customer: Customer | null): void {
  buildInvoiceDoc(invoice, profile, customer).save(`${invoice.invoiceNumber}.pdf`);
}

export function getInvoicePdfBlob(invoice: Invoice, profile: Profile, customer: Customer | null): Blob {
  return buildInvoiceDoc(invoice, profile, customer).output('blob');
}

function buildInvoiceDoc(invoice: Invoice, profile: Profile, customer: Customer | null): jsPDF {
  const lang: Lang = invoice.language || 'de';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawModernHeader(doc, profile, T[lang].nr, invoice.invoiceNumber, formatDate(invoice.invoiceDate));
  y = drawDocTitle(doc, T[lang].invoice, y);

  // Service period / due date info line
  if (invoice.servicePeriod || invoice.dueDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    text(doc, SLATE_500);
    const parts: string[] = [];
    if (invoice.servicePeriod) parts.push(`${T[lang].servicePeriod}: ${invoice.servicePeriod}`);
    if (invoice.dueDate) parts.push(`${T[lang].dueDate}: ${formatDate(invoice.dueDate)}`);
    doc.text(parts.join('   ·   '), ML, y);
    y += 7;
  }

  // FROM / TO
  y = drawFromTo(
    doc,
    lang === 'de' ? 'Von' : 'From', profileAddressLines(profile),
    lang === 'de' ? 'An'  : 'To',   customer ? customerAddressLines(customer) : ['–'],
    y,
  );

  // Intro text
  if (invoice.introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    text(doc, SLATE_700);
    const lines = doc.splitTextToSize(invoice.introText, BODY_W);
    doc.text(lines, ML, y);
    y += lines.length * 4.8 + 6;
  }

  // Line items table
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [['#', T[lang].description, T[lang].unitPrice, T[lang].vat, T[lang].netAmount]],
    body: invoice.items.map((item, i) => [
      String(i + 1),
      item.description,
      formatCurrency(item.netUnitPrice),
      `${item.vatRate}%`,
      formatCurrency(item.netTotal),
    ]),
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: SLATE_50 },
    bodyStyles: {
      fontSize: 8.5,
      textColor: SLATE_700,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
    },
    tableLineColor: SLATE_200,
    tableLineWidth: 0.15,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  y = drawModernTotals(doc, invoice.netTotal, invoice.vatTotals, invoice.grossTotal, y, lang);

  // Payment text
  if (invoice.paymentText) {
    y = drawTextBlock(doc, lang === 'de' ? 'Zahlungsanweisung' : 'Payment Details', invoice.paymentText, y);
  }

  // Notes
  if (invoice.notes) {
    y = drawTextBlock(doc, lang === 'de' ? 'Hinweise' : 'Notes', invoice.notes, y);
  }

  // Signature
  if (profile.signatureOnInvoice && profile.signature) {
    drawSignature(doc, profile, y + 4);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// ── DELIVERY NOTE PDF ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export function generateDeliveryNotePDF(note: DeliveryNote, profile: Profile, customer: Customer | null): void {
  buildDeliveryNoteDoc(note, profile, customer).save(`${note.deliveryNoteNumber}.pdf`);
}

export function getDeliveryNotePdfBlob(note: DeliveryNote, profile: Profile, customer: Customer | null): Blob {
  return buildDeliveryNoteDoc(note, profile, customer).output('blob');
}

function buildDeliveryNoteDoc(note: DeliveryNote, profile: Profile, customer: Customer | null): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawModernHeader(doc, profile, 'Nummer', note.deliveryNoteNumber, formatDate(note.deliveryDate));
  y = drawDocTitle(doc, 'Lieferschein', y);

  // FROM / TO
  y = drawFromTo(
    doc,
    'Von', profileAddressLines(profile),
    'An',  customer ? customerAddressLines(customer) : ['–'],
    y,
  );

  // Intro text
  if (note.introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    text(doc, SLATE_700);
    const lines = doc.splitTextToSize(note.introText, BODY_W);
    doc.text(lines, ML, y);
    y += lines.length * 4.8 + 6;
  }

  const hasPrices = note.items.some((item) => (item.netUnitPrice ?? 0) > 0);

  if (hasPrices) {
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['#', 'Artikel / Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'MwSt.', 'Nettobetrag']],
      body: note.items.map((item, i) => [
        String(i + 1),
        item.description + (item.notes ? `\n${item.notes}` : ''),
        item.quantity.toString(),
        item.unit,
        formatCurrency(item.netUnitPrice ?? 0),
        `${item.vatRate ?? 0}%`,
        formatCurrency(item.netTotal ?? 0),
      ]),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
      alternateRowStyles: { fillColor: SLATE_50 },
      bodyStyles: { fontSize: 8.5, textColor: SLATE_700, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 } },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 18 },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 26, halign: 'right' },
      },
      tableLineColor: SLATE_200,
      tableLineWidth: 0.15,
    });
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['#', 'Artikel / Beschreibung', 'Menge', 'Einheit', 'Bemerkung']],
      body: note.items.map((item, i) => [
        String(i + 1),
        item.description,
        item.quantity.toString(),
        item.unit,
        item.notes || '',
      ]),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
      alternateRowStyles: { fillColor: SLATE_50 },
      bodyStyles: { fontSize: 8.5, textColor: SLATE_700, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 } },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 22 },
      },
      tableLineColor: SLATE_200,
      tableLineWidth: 0.15,
    });
  }

  y = (doc as any).lastAutoTable.finalY + 8;

  if (hasPrices) {
    y = drawModernTotals(doc, note.netTotal ?? 0, note.vatTotals ?? [], note.grossTotal ?? 0, y);
  }

  // Note text
  if (note.noteText) {
    y = drawTextBlock(doc, 'Hinweise', note.noteText, y);
  }

  // Delivery confirmation line
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  text(doc, GOLD);
  doc.text('WARENEMPFANG BESTÄTIGT', ML, y);
  y += 6;

  draw(doc, SLATE_200);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 14, ML + 72, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  text(doc, SLATE_500);
  doc.text('Unterschrift / Datum', ML, y + 19);

  if (profile.signatureOnDeliveryNote && profile.signature) {
    drawSignature(doc, profile, y + 24);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// ── LETTER PDF ────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export function generateLetterPDF(letter: Letter, profile: Profile, customer: Customer | null): void {
  buildLetterDoc(letter, profile, customer).save(`${letter.title || 'Schreiben'}.pdf`);
}

export function getLetterPdfBlob(letter: Letter, profile: Profile, customer: Customer | null): Blob {
  return buildLetterDoc(letter, profile, customer).output('blob');
}

function buildLetterDoc(letter: Letter, profile: Profile, customer: Customer | null): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawModernHeader(doc, profile, 'Datum', formatDate(letter.letterDate), formatDate(letter.letterDate));

  // FROM / TO section (or just date + title if no customer)
  if (customer) {
    y = drawFromTo(
      doc,
      'Von', profileAddressLines(profile),
      'An',  customerAddressLines(customer),
      y,
    );
  } else {
    y += 4;
  }

  // Title / subject
  y = drawDocTitle(doc, letter.title || 'Schreiben', y);

  // Gold separator line
  fill(doc, GOLD_BG);
  doc.rect(ML, y - 3, BODY_W, 0.5, 'F');

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  text(doc, SLATE_700);
  const bodyLines = doc.splitTextToSize(letter.content, BODY_W);
  doc.text(bodyLines, ML, y + 2);
  y += bodyLines.length * 5.2 + 10;

  // Signature
  if (profile.signatureOnLetter && profile.signature) {
    drawSignature(doc, profile, y);
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// ── RECEIPT PDF ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bar: 'Bar',
  überweisung: 'Überweisung',
  karte: 'Kartenzahlung',
  sonstige: 'Sonstige',
};

export function generateReceiptPDF(receipt: Receipt, profile: Profile): void {
  buildReceiptDoc(receipt, profile).save(`Quittung-${receipt.receiptNumber}.pdf`);
}

export function getReceiptPdfBlob(receipt: Receipt, profile: Profile): Blob {
  return buildReceiptDoc(receipt, profile).output('blob');
}

function buildReceiptDoc(receipt: Receipt, profile: Profile): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawModernHeader(doc, profile, 'Nummer', receipt.receiptNumber, formatDate(receipt.date));
  y = drawDocTitle(doc, 'Quittung', y);

  // Info rows
  const rows: [string, string][] = [
    ['Empfangen von', receipt.payerName || '–'],
    ['Betrag',        formatCurrency(receipt.amount)],
    ['Verwendungszweck', receipt.purpose || '–'],
    ['Zahlungsart',   PAYMENT_METHOD_LABEL[receipt.paymentMethod] || receipt.paymentMethod],
  ];
  if (receipt.notes) rows.push(['Bemerkung', receipt.notes]);

  rows.forEach(([label, value], idx) => {
    const rowBg: RGB = idx % 2 === 0 ? SLATE_50 : WHITE;
    fill(doc, rowBg);
    doc.rect(ML, y, BODY_W, 9, 'F');

    // Left label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    text(doc, SLATE_500);
    doc.text(label, ML + 3, y + 6);

    // Right value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    text(doc, SLATE_900);
    const valLines = doc.splitTextToSize(value, BODY_W * 0.58);
    doc.text(valLines, ML + 68, y + 6);
    y += 10;
  });

  // Amount highlight box
  y += 6;
  fill(doc, GOLD_BG);
  doc.rect(ML, y, BODY_W, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  text(doc, NAVY);
  doc.text('BETRAG', ML + 4, y + 8);
  doc.text(formatCurrency(receipt.amount), PAGE_W - MR - 4, y + 8, { align: 'right' });
  y += 20;

  // Signature
  if (profile.signature) {
    drawSignature(doc, profile, y);
    y += 34;
  }

  drawModernFooter(doc, profile);
  return doc;
}

// ── PDF sharing helper ────────────────────────────────────────────────────────
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
    } catch { /* user cancelled */ }
  }
  const url = URL.createObjectURL(blob);
  fallback(url);
}
