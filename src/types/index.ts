export interface Profile {
  id: string;
  internalName: string;
  pin: string;
  companyName: string;
  personName: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  taxNumber: string;
  vatId: string;
  bankName: string;
  iban: string;
  bic: string;
  paymentTerms: string;
  logo: string | null;
  signature: string | null;
  signatureOnInvoice: boolean;
  signatureOnDeliveryNote: boolean;
  signatureOnLetter: boolean;
  logoOnPdf: boolean;
  pdfFooter: string;
  invoiceCounter: number;
  deliveryNoteCounter: number;
  receiptCounter: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  profileId: string;
  customerNumber: string;
  companyName: string;
  contactPerson: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  mobile: string;
  notes: string;
  createdAt: string;
}

export interface Article {
  id: string;
  profileId: string | null;
  articleNumber: string;
  name: string;
  description: string;
  unit: string;
  netPrice: number;
  vatRate: 0 | 7 | 19;
  createdAt: string;
}

export type TemplateType =
  | 'invoice_intro'
  | 'invoice_payment'
  | 'delivery_intro'
  | 'delivery_note'
  | 'letter'
  | 'footer';

export interface Template {
  id: string;
  profileId: string | null;
  type: TemplateType;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  articleId: string | null;
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  netUnitPrice: number;
  vatRate: 0 | 7 | 19;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  profileId: string;
  customerId: string;
  invoiceNumber: string;
  servicePeriod: string;
  invoiceDate: string;
  dueDate: string;
  language: 'de' | 'en';
  status: InvoiceStatus;
  introText: string;
  paymentText: string;
  items: InvoiceItem[];
  netTotal: number;
  vatTotals: { rate: number; amount: number }[];
  grossTotal: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryNoteItem {
  id: string;
  articleId: string | null;
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  netUnitPrice: number;
  vatRate: 0 | 7 | 19;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  notes: string;
}

export type DeliveryNoteStatus = 'draft' | 'sent' | 'delivered';

export interface DeliveryNote {
  id: string;
  profileId: string;
  customerId: string;
  deliveryNoteNumber: string;
  deliveryDate: string;
  status: DeliveryNoteStatus;
  introText: string;
  noteText: string;
  paymentText: string;
  items: DeliveryNoteItem[];
  netTotal: number;
  vatTotals: { rate: number; amount: number }[];
  grossTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id: string;
  profileId: string;
  customerId: string | null;
  language: 'de' | 'en';
  title: string;
  content: string;
  templateId: string | null;
  letterDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  pin: string;
  currency: string;
  dateFormat: string;
}

export type PaymentMethod = 'bar' | 'überweisung' | 'karte' | 'sonstige';

export interface Receipt {
  id: string;
  profileId: string;
  invoiceId: string | null;
  receiptNumber: string;
  date: string;
  amount: number;
  payerName: string;
  purpose: string;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  profileId: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  createdAt: string;
}
