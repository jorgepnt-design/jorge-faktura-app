import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, DeliveryNote, Profile, Customer } from '../types';
import { formatCurrency, formatDate } from './helpers';

function addHeader(
  doc: jsPDF,
  profile: Profile,
  customer: Customer | null,
  title: string,
  docNumber: string,
  docDate: string,
  additionalInfo?: Record<string, string>
) {
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Logo
  if (profile.logo) {
    try {
      const imgType = profile.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(profile.logo, imgType, 14, y, 50, 20);
    } catch {
      // skip logo if invalid
    }
  }

  // Sender info (right side)
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const senderLines = [
    profile.companyName || profile.internalName,
    profile.personName,
    profile.address,
    `${profile.zipCode} ${profile.city}`,
    profile.country,
    profile.email,
    profile.phone || profile.mobile,
  ].filter(Boolean);

  senderLines.forEach((line, i) => {
    doc.text(line, pageW - 14, y + 4 + i * 4, { align: 'right' });
  });

  y += 32;
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Document title
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(docNumber, 14, y + 8);
  doc.text(`Datum: ${formatDate(docDate)}`, 14, y + 14);

  if (additionalInfo) {
    let offset = 20;
    Object.entries(additionalInfo).forEach(([k, v]) => {
      if (v) {
        doc.text(`${k}: ${v}`, 14, y + offset);
        offset += 6;
      }
    });
  }

  // Customer address
  if (customer) {
    const addrX = pageW / 2 + 10;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const addrLines = [
      customer.companyName,
      customer.contactPerson,
      customer.address,
      `${customer.zipCode} ${customer.city}`,
      customer.country,
    ].filter(Boolean);
    addrLines.forEach((line, i) => {
      doc.text(line, addrX, y + i * 5);
    });
  }

  return y + 50;
}

function addFooter(doc: jsPDF, profile: Profile) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);

  const footerParts: string[] = [];
  if (profile.iban) footerParts.push(`IBAN: ${profile.iban}`);
  if (profile.bic) footerParts.push(`BIC: ${profile.bic}`);
  if (profile.bankName) footerParts.push(profile.bankName);
  if (profile.vatId) footerParts.push(`USt-IdNr.: ${profile.vatId}`);
  if (profile.taxNumber) footerParts.push(`St-Nr.: ${profile.taxNumber}`);

  const footerText = profile.pdfFooter || footerParts.join('  |  ');
  if (footerText) {
    doc.line(14, pageH - 18, pageW - 14, pageH - 18);
    const lines = doc.splitTextToSize(footerText, pageW - 28);
    doc.text(lines, pageW / 2, pageH - 14, { align: 'center' });
  }
}

export function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  customer: Customer | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addHeader(
    doc,
    profile,
    customer,
    'Rechnung',
    invoice.invoiceNumber,
    invoice.invoiceDate,
    {
      'Leistungszeitraum': invoice.servicePeriod,
      'Fällig bis': invoice.dueDate ? formatDate(invoice.dueDate) : '',
    }
  );

  // Intro text
  if (invoice.introText) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const introLines = doc.splitTextToSize(invoice.introText, 180);
    doc.text(introLines, 14, y);
    y += introLines.length * 5 + 6;
  }

  // Line items
  const tableData = invoice.items.map((item, idx) => [
    String(idx + 1),
    item.description,
    String(item.quantity),
    item.unit,
    formatCurrency(item.netUnitPrice),
    `${item.vatRate}%`,
    formatCurrency(item.netTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'MwSt.', 'Nettobetrag']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { halign: 'right' },
      4: { halign: 'right' },
      6: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Totals
  const totalsX = 120;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  doc.text('Nettobetrag:', totalsX, y);
  doc.text(formatCurrency(invoice.netTotal), 196, y, { align: 'right' });
  y += 6;

  invoice.vatTotals.forEach((vt) => {
    doc.text(`MwSt. ${vt.rate}%:`, totalsX, y);
    doc.text(formatCurrency(vt.amount), 196, y, { align: 'right' });
    y += 6;
  });

  doc.line(totalsX, y, 196, y);
  y += 4;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Gesamtbetrag:', totalsX, y);
  doc.text(formatCurrency(invoice.grossTotal), 196, y, { align: 'right' });
  y += 10;

  // Payment text
  if (invoice.paymentText) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const payLines = doc.splitTextToSize(invoice.paymentText, 180);
    doc.text(payLines, 14, y);
    y += payLines.length * 4.5 + 6;
  }

  addFooter(doc, profile);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function generateDeliveryNotePDF(
  note: DeliveryNote,
  profile: Profile,
  customer: Customer | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addHeader(
    doc,
    profile,
    customer,
    'Lieferschein',
    note.deliveryNoteNumber,
    note.deliveryDate
  );

  if (note.introText) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const introLines = doc.splitTextToSize(note.introText, 180);
    doc.text(introLines, 14, y);
    y += introLines.length * 5 + 6;
  }

  const tableData = note.items.map((item, idx) => [
    String(idx + 1),
    item.description,
    String(item.quantity),
    item.unit,
    item.notes || '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Artikel', 'Menge', 'Einheit', 'Bemerkung']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (note.noteText) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(note.noteText, 180);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 4.5 + 6;
  }

  // Signature area
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Warenempfang bestätigt:', 14, y);
  doc.line(14, y + 15, 80, y + 15);
  doc.text('Unterschrift / Datum', 14, y + 20);

  addFooter(doc, profile);

  doc.save(`${note.deliveryNoteNumber}.pdf`);
}
