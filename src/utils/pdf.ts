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
    nr:            'Nr',
    datum:         'Datum',
    servicePeriod: 'Leistungszeitraum',
    dueDate:       'Fällig bis',
    description:   'Beschreibung',
    unitPrice:     'Einzelpreis',
    vat:           'MwSt.',
    netAmount:     'Nettobetrag',
    totalAmount:   'Gesamtbetrag',
    vatLabel:      (rate) => `MwSt. ${rate}%:`,
  },
  en: {
    invoice:       'Invoice',
    nr:            'No',
    datum:         'Date',
    servicePeriod: 'Service Period',
    dueDate:       'Due Date',
    description:   'Description',
    unitPrice:     'Unit Price',
    vat:           'VAT',
    netAmount:     'Net Amount',
    totalAmount:   'Total Amount',
    vatLabel:      (rate) => `VAT ${rate}%:`,
  },
};

// ── Color palette ────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const PRIMARY: RGB    = [30,  64, 175];  // blue-800
const ACCENT: RGB     = [59, 130, 246];  // blue-500
const SLATE_900: RGB  = [15,  23,  42];
const SLATE_700: RGB  = [51,  65,  85];
const SLATE_500: RGB  = [100, 116, 139];
const SLATE_300: RGB  = [203, 213, 225];
const SLATE_100: RGB  = [241, 245, 249];
const BLUE_50: RGB    = [239, 246, 255];
const WHITE: RGB      = [255, 255, 255];

// ── Layout constants ─────────────────────────────────────────────────────────
const PAGE_W   = 210;
const ML       = 14;   // margin left
const MR       = 14;   // margin right
const BODY_W   = PAGE_W - ML - MR; // 182 mm

// ── Helpers ──────────────────────────────────────────────────────────────────
const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const draw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const text = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

// ── Shared header (company branding + accent rule) ───────────────────────────
function drawBrandHeader(doc: jsPDF, profile: Profile): number {
  let y = 15;
  let nameX = ML;

  if (profile.logo) {
    try {
      const imgType = profile.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(profile.logo, imgType, ML, y, 32, 14);
      nameX = ML + 36;
    } catch { /* skip invalid logo */ }
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  text(doc, SLATE_900);
  doc.text(profile.companyName || profile.internalName, nameX, y + 9);

  // Person / subtitle
  if (profile.personName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    text(doc, SLATE_500);
    doc.text(profile.personName, nameX, y + 15);
  }

  // Contact details (right-aligned)
  const contactLines: string[] = [
    [profile.address, `${profile.zipCode} ${profile.city}`.trim()].filter(Boolean).join(', '),
    profile.email,
    profile.phone || profile.mobile,
    profile.website,
  ].filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  text(doc, SLATE_500);
  contactLines.forEach((line, i) => {
    doc.text(line, PAGE_W - MR, y + 7 + i * 4.5, { align: 'right' });
  });

  y += 22;

  // Accent rule
  draw(doc, ACCENT);
  doc.setLineWidth(0.6);
  doc.line(ML, y, PAGE_W - MR, y);
  doc.setLineWidth(0.2);

  return y + 8; // return y after the rule
}

// ── Document meta box (right column, below header) ───────────────────────────
function drawMetaBox(
  doc: jsPDF,
  title: string,
  docNumber: string,
  docDate: string,
  extraMeta: Array<{ label: string; value: string }>,
  y: number,
  lang: Lang = 'de'
): void {
  const boxX = 120;
  const boxW  = PAGE_W - MR - boxX; // ~76 mm
  const rows  = extraMeta.filter((m) => m.value).length;
  const boxH  = 10 + 7 + (2 + rows) * 5.5 + 4;

  fill(doc, BLUE_50);
  draw(doc, SLATE_300);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y - 2, boxW, boxH, 2, 2, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  text(doc, PRIMARY);
  doc.text(title.toUpperCase(), boxX + boxW / 2, y + 7, { align: 'center' });

  // Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  text(doc, SLATE_700);
  let dy = y + 14;
  doc.text(`${T[lang].nr}: ${docNumber}`, boxX + 4, dy);
  dy += 5.5;
  doc.text(`${T[lang].datum}: ${formatDate(docDate)}`, boxX + 4, dy);

  extraMeta.forEach(({ label, value }) => {
    if (value) {
      dy += 5.5;
      doc.text(`${label}: ${value}`, boxX + 4, dy);
    }
  });
}

// ── Recipient address block (left column, DIN 5008 style) ────────────────────
function drawAddressBlock(
  doc: jsPDF,
  profile: Profile,
  customer: Customer,
  y: number
): void {
  // Tiny sender reference line (for windowed envelope)
  const senderRef = [
    profile.companyName || profile.internalName,
    profile.address,
    `${profile.zipCode} ${profile.city}`.trim(),
  ].filter(Boolean).join(', ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  text(doc, SLATE_300);
  doc.text(senderRef, ML, y);

  draw(doc, SLATE_300);
  doc.setLineWidth(0.15);
  doc.line(ML, y + 2.5, 110, y + 2.5);

  // Recipient
  const addrLines = [
    customer.companyName,
    customer.contactPerson,
    customer.address,
    `${customer.zipCode} ${customer.city}`.trim(),
    customer.country && customer.country !== 'Deutschland' ? customer.country : '',
  ].filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  text(doc, SLATE_900);
  addrLines.forEach((line, i) => {
    doc.text(line, ML, y + 9 + i * 5.5);
  });
}

// ── Totals section ────────────────────────────────────────────────────────────
function drawTotals(
  doc: jsPDF,
  netTotal: number,
  vatTotals: { rate: number; amount: number }[],
  grossTotal: number,
  startY: number,
  lang: Lang = 'de'
): number {
  const boxX = 120;
  const boxW  = PAGE_W - MR - boxX;
  const rows  = vatTotals.length + 1; // net + vat rows
  const innerH = rows * 6.5 + 4;
  const totalRowH = 10;
  const boxH  = innerH + totalRowH + 2;

  fill(doc, SLATE_100);
  draw(doc, SLATE_300);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, startY, boxW, boxH, 2, 2, 'FD');

  let ty = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_700);

  // Net total
  doc.text(`${T[lang].netAmount}:`, boxX + 4, ty);
  doc.text(formatCurrency(netTotal), PAGE_W - MR - 3, ty, { align: 'right' });
  ty += 6.5;

  // VAT rows
  vatTotals.forEach((vt) => {
    doc.text(T[lang].vatLabel(vt.rate), boxX + 4, ty);
    doc.text(formatCurrency(vt.amount), PAGE_W - MR - 3, ty, { align: 'right' });
    ty += 6.5;
  });

  // Separator inside box
  draw(doc, SLATE_300);
  doc.setLineWidth(0.3);
  doc.line(boxX + 3, ty - 1, PAGE_W - MR - 3, ty - 1);
  ty += 3;

  // Gross total (colored row)
  fill(doc, PRIMARY);
  draw(doc, PRIMARY);
  doc.roundedRect(boxX, ty - 5, boxW, totalRowH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  text(doc, WHITE);
  doc.text(`${T[lang].totalAmount}:`, boxX + 4, ty + 1);
  doc.text(formatCurrency(grossTotal), PAGE_W - MR - 3, ty + 1, { align: 'right' });

  return startY + boxH + 10;
}

// ── Payment text box ──────────────────────────────────────────────────────────
function drawPaymentBox(doc: jsPDF, paymentText: string, y: number): number {
  const lines = doc.splitTextToSize(paymentText, BODY_W - 8);
  const boxH  = lines.length * 4.5 + 8;

  fill(doc, BLUE_50);
  draw(doc, SLATE_300);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, BODY_W, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_700);
  doc.text(lines, ML + 4, y + 6);

  return y + boxH + 8;
}

// ── Signature ────────────────────────────────────────────────────────────────
function drawSignature(doc: jsPDF, profile: Profile, y: number): number {
  if (!profile.signature) return y;
  try {
    const imgType = profile.signature.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    // Draw signature image (max 60mm wide, 20mm tall)
    doc.addImage(profile.signature, imgType, ML, y, 60, 20);
    draw(doc, SLATE_300);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 22, ML + 60, y + 22);
    text(doc, SLATE_500);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(profile.personName || profile.companyName || '', ML, y + 26);
  } catch { /* skip if image invalid */ }
  return y + 26;
}

// ── Professional footer ───────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, profile: Profile): void {
  const pageH = doc.internal.pageSize.getHeight();

  draw(doc, SLATE_300);
  doc.setLineWidth(0.4);
  doc.line(ML, pageH - 20, PAGE_W - MR, pageH - 20);

  const parts: string[] = [];
  if (profile.iban)       parts.push(`IBAN: ${profile.iban}`);
  if (profile.bic)        parts.push(`BIC: ${profile.bic}`);
  if (profile.bankName)   parts.push(profile.bankName);
  if (profile.vatId)      parts.push(`USt-IdNr.: ${profile.vatId}`);
  if (profile.taxNumber)  parts.push(`St-Nr.: ${profile.taxNumber}`);

  const footerText = profile.pdfFooter || parts.join('  ·  ');
  if (footerText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    text(doc, SLATE_500);
    const lines = doc.splitTextToSize(footerText, BODY_W);
    doc.text(lines, PAGE_W / 2, pageH - 14, { align: 'center' });
  }
}

// ── Invoice PDF ───────────────────────────────────────────────────────────────
export function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  customer: Customer | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const lang: Lang = invoice.language || 'de';

  // Brand header
  let y = drawBrandHeader(doc, profile);

  // Two-column: address (left) + meta box (right)
  const sectionY = y;

  drawMetaBox(doc, T[lang].invoice, invoice.invoiceNumber, invoice.invoiceDate, [
    { label: T[lang].servicePeriod, value: invoice.servicePeriod || '' },
    { label: T[lang].dueDate, value: invoice.dueDate ? formatDate(invoice.dueDate) : '' },
  ], sectionY, lang);

  if (customer) {
    drawAddressBlock(doc, profile, customer, sectionY);
  }

  y = sectionY + 42;

  // Intro text
  if (invoice.introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    text(doc, SLATE_700);
    const lines = doc.splitTextToSize(invoice.introText, BODY_W);
    doc.text(lines, ML, y);
    y += lines.length * 4.5 + 8;
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
      fillColor: PRIMARY,
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
  y = drawTotals(doc, invoice.netTotal, invoice.vatTotals, invoice.grossTotal, y, lang);

  // Payment text
  if (invoice.paymentText) {
    y = drawPaymentBox(doc, invoice.paymentText, y);
  }

  // Signature
  if (profile.signatureOnInvoice && profile.signature) {
    y = drawSignature(doc, profile, y + 4);
  }

  drawFooter(doc, profile);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ── Delivery Note PDF ─────────────────────────────────────────────────────────
export function generateDeliveryNotePDF(
  note: DeliveryNote,
  profile: Profile,
  customer: Customer | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawBrandHeader(doc, profile);

  const sectionY = y;
  drawMetaBox(doc, 'Lieferschein', note.deliveryNoteNumber, note.deliveryDate, [], sectionY);
  if (customer) drawAddressBlock(doc, profile, customer, sectionY);

  y = sectionY + 42;

  // Intro text
  if (note.introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    text(doc, SLATE_700);
    const lines = doc.splitTextToSize(note.introText, BODY_W);
    doc.text(lines, ML, y);
    y += lines.length * 4.5 + 8;
  }

  // Determine if any item has a price (to decide which columns to show)
  const hasPrices = note.items.some((item) => (item.netUnitPrice ?? 0) > 0);

  // Items table
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
        fillColor: PRIMARY,
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
    // Simple table without price columns
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
        fillColor: PRIMARY,
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

  // Totals (only when prices are set)
  if (hasPrices) {
    y = drawTotals(doc, note.netTotal ?? 0, note.vatTotals ?? [], note.grossTotal ?? 0, y);
  }

  // Note text box
  if (note.noteText) {
    fill(doc, SLATE_100);
    draw(doc, SLATE_300);
    doc.setLineWidth(0.2);
    const noteLines = doc.splitTextToSize(note.noteText, BODY_W - 8);
    const boxH = noteLines.length * 4.5 + 8;
    doc.roundedRect(ML, y, BODY_W, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(doc, SLATE_700);
    doc.text(noteLines, ML + 4, y + 6);
    y += boxH + 10;
  }

  // Signature area
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  text(doc, SLATE_500);
  doc.text('Warenempfang bestätigt:', ML, y);

  draw(doc, SLATE_300);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 16, ML + 72, y + 16);

  doc.setFontSize(7.5);
  text(doc, SLATE_300);
  doc.text('Unterschrift / Datum', ML, y + 21);

  // Signature
  if (profile.signatureOnDeliveryNote && profile.signature) {
    drawSignature(doc, profile, y + 26);
  }

  drawFooter(doc, profile);
  doc.save(`${note.deliveryNoteNumber}.pdf`);
}

// ── Letter PDF ────────────────────────────────────────────────────────────────
export function generateLetterPDF(
  letter: Letter,
  profile: Profile,
  customer: Customer | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawBrandHeader(doc, profile);

  // Address + date section
  const sectionY = y;

  if (customer) {
    drawAddressBlock(doc, profile, customer, sectionY);
    y = sectionY + 42;
  } else {
    y = sectionY + 8;
  }

  // Date (right-aligned, at top of address section)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  text(doc, SLATE_500);
  doc.text(formatDate(letter.letterDate), PAGE_W - MR, sectionY + 8, { align: 'right' });

  // Subject / Title
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  text(doc, SLATE_900);
  doc.text(letter.title, ML, y);
  y += 7;

  draw(doc, SLATE_300);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 9;

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  text(doc, SLATE_700);
  const bodyLines = doc.splitTextToSize(letter.content, BODY_W);
  doc.text(bodyLines, ML, y);
  y += bodyLines.length * 5 + 8;

  // Signature
  if (profile.signatureOnLetter && profile.signature) {
    drawSignature(doc, profile, y);
  }

  drawFooter(doc, profile);
  doc.save(`${letter.title || 'Schreiben'}.pdf`);
}

// ── Receipt PDF ───────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bar: 'Bar',
  überweisung: 'Überweisung',
  karte: 'Karte',
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
  let y = drawBrandHeader(doc, profile);
  y += 6;

  // Title row
  fill(doc, PRIMARY);
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.roundedRect(ML, y, BODY_W, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  text(doc, WHITE);
  doc.text('QUITTUNG', ML + 4, y + 8);
  doc.setFontSize(10);
  doc.text(receipt.receiptNumber, PAGE_W - MR - 4, y + 8, { align: 'right' });
  y += 18;

  // Date line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  text(doc, SLATE_500);
  doc.text(`Datum: ${formatDate(receipt.date)}`, PAGE_W - MR, y, { align: 'right' });
  y += 10;

  // Info box
  const rows: [string, string][] = [
    ['Empfangen von', receipt.payerName || '–'],
    ['Betrag', formatCurrency(receipt.amount)],
    ['Verwendungszweck', receipt.purpose || '–'],
    ['Zahlungsart', PAYMENT_METHOD_LABEL[receipt.paymentMethod] || receipt.paymentMethod],
  ];
  if (receipt.notes) rows.push(['Bemerkung', receipt.notes]);

  rows.forEach(([label, value]) => {
    fill(doc, SLATE_100);
    doc.setFillColor(SLATE_100[0], SLATE_100[1], SLATE_100[2]);
    doc.roundedRect(ML, y, BODY_W, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    text(doc, SLATE_500);
    doc.text(label, ML + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    text(doc, SLATE_900);
    const valLines = doc.splitTextToSize(value, BODY_W * 0.6);
    doc.text(valLines, ML + 55, y + 5.5);
    y += 10;
  });

  y += 8;

  // Signature
  if (profile.signature) {
    drawSignature(doc, profile, y);
    y += 28;
  }

  drawFooter(doc, profile);
  return doc;
}

// ── PDF blob helpers (for sharing) ────────────────────────────────────────────

export function getInvoicePdfBlob(invoice: Invoice, profile: Profile, customer: Customer): Blob {
  // We need to re-build without saving — wrap the existing function approach
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // Re-use the internal builder by generating and capturing
  // Since generateInvoicePDF calls doc.save(), we use a workaround:
  // temporarily override save, generate, then restore.
  const original = jsPDF.prototype.save;
  let capturedBlob: Blob | null = null;
  jsPDF.prototype.save = function () {
    capturedBlob = this.output('blob');
  } as unknown as typeof jsPDF.prototype.save;
  generateInvoicePDF(invoice, profile, customer);
  jsPDF.prototype.save = original;
  return capturedBlob ?? doc.output('blob');
}

export function getDeliveryNotePdfBlob(dn: DeliveryNote, profile: Profile, customer: Customer): Blob {
  const original = jsPDF.prototype.save;
  let capturedBlob: Blob | null = null;
  jsPDF.prototype.save = function () {
    capturedBlob = this.output('blob');
  } as unknown as typeof jsPDF.prototype.save;
  generateDeliveryNotePDF(dn, profile, customer);
  jsPDF.prototype.save = original;
  return capturedBlob ?? new jsPDF().output('blob');
}

export function getLetterPdfBlob(letter: Letter, profile: Profile, customer: Customer | null): Blob {
  const original = jsPDF.prototype.save;
  let capturedBlob: Blob | null = null;
  jsPDF.prototype.save = function () {
    capturedBlob = this.output('blob');
  } as unknown as typeof jsPDF.prototype.save;
  generateLetterPDF(letter, profile, customer);
  jsPDF.prototype.save = original;
  return capturedBlob ?? new jsPDF().output('blob');
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
