export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateInvoiceNumber(counter: number): string {
  return `RE-${String(10000 + counter).padStart(5, '0')}`;
}

export function generateDeliveryNoteNumber(counter: number): string {
  return `LS-${String(10000 + counter).padStart(5, '0')}`;
}

export function generateCustomerNumber(counter: number): string {
  return `KD-${String(1000 + counter).padStart(4, '0')}`;
}

export function calculateLineItem(
  quantity: number,
  netUnitPrice: number,
  vatRate: 0 | 7 | 19
) {
  const netTotal = quantity * netUnitPrice;
  const vatTotal = netTotal * (vatRate / 100);
  const grossTotal = netTotal + vatTotal;
  return { netTotal, vatTotal, grossTotal };
}

export function calculateInvoiceTotals(
  items: { netTotal: number; vatTotal: number; grossTotal: number; vatRate: 0 | 7 | 19 }[]
) {
  const netTotal = items.reduce((sum, i) => sum + i.netTotal, 0);
  const grossTotal = items.reduce((sum, i) => sum + i.grossTotal, 0);

  const vatMap: Record<number, number> = {};
  items.forEach((i) => {
    vatMap[i.vatRate] = (vatMap[i.vatRate] || 0) + i.vatTotal;
  });
  const vatTotals = Object.entries(vatMap).map(([rate, amount]) => ({
    rate: Number(rate),
    amount,
  }));

  return { netTotal, vatTotals, grossTotal };
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    open: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    sent: 'bg-amber-100 text-amber-700',
    delivered: 'bg-green-100 text-green-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Entwurf',
    open: 'Offen',
    paid: 'Bezahlt',
    cancelled: 'Storniert',
    sent: 'Gesendet',
    delivered: 'Geliefert',
  };
  return map[status] || status;
}

export function getTemplateTypeLabel(type: string): string {
  const map: Record<string, string> = {
    invoice_intro: 'Auftragstext (Rechnung)',
    invoice_payment: 'Zahlungsanweisung (Rechnung)',
    delivery_intro: 'Auftragstext (Lieferschein)',
    delivery_note: 'Hinweistext (Lieferschein)',
    letter: 'Anschreiben',
    footer: 'Fußzeile',
  };
  return map[type] || type;
}
