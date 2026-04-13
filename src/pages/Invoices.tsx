import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, FileText, MoreVertical, Edit2, Trash2, Copy,
  Download, CheckCircle, XCircle, Eye, ChevronDown, Trash,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import TemplateTextSelector from '../components/templates/TemplateTextSelector';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel,
  calculateLineItem, calculateInvoiceTotals, todayISO, generateId,
} from '../utils/helpers';
import { generateInvoicePDF } from '../utils/pdf';

const VAT_RATES = [0, 7, 19] as const;
const UNITS = ['Stk.', 'Std.', 'Tage', 'km', 'Pauschal', 'm²', 'Liter', 'kg'];
const STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'open', label: 'Offen' },
  { value: 'paid', label: 'Bezahlt' },
  { value: 'cancelled', label: 'Storniert' },
];

type InvoiceFormData = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>;

function emptyForm(profileId: string): InvoiceFormData {
  return {
    profileId,
    customerId: '',
    servicePeriod: '',
    invoiceDate: todayISO(),
    dueDate: '',
    language: 'de',
    status: 'draft',
    introText: '',
    paymentText: '',
    items: [],
    netTotal: 0,
    vatTotals: [],
    grossTotal: 0,
    notes: '',
  };
}

function emptyItem(): InvoiceItem {
  return {
    id: generateId(),
    articleId: null,
    description: '',
    quantity: 1,
    unit: 'Stk.',
    netUnitPrice: 0,
    vatRate: 19,
    netTotal: 0,
    vatTotal: 0,
    grossTotal: 0,
  };
}

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const {
    profiles, loggedInProfileId, customers, invoices, articles,
    addInvoice, updateInvoice, deleteInvoice, duplicateInvoice,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(emptyForm(loggedInProfileId || ''));

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openForm();
    }
  }, []);

  const profileCustomers = useMemo(
    () => customers.filter((c) => c.profileId === form.profileId),
    [customers, form.profileId]
  );

  const profileArticles = useMemo(
    () => articles.filter((a) => a.profileId === null || a.profileId === form.profileId),
    [articles, form.profileId]
  );

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const matchProfile = filterProfile ? i.profileId === filterProfile : true;
      const q = search.toLowerCase();
      const customer = customers.find((c) => c.id === i.customerId);
      const matchSearch =
        !search ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        customer?.companyName.toLowerCase().includes(q) ||
        getStatusLabel(i.status).toLowerCase().includes(q);
      return matchProfile && matchSearch;
    });
  }, [invoices, customers, search, filterProfile]);

  const openForm = (invoice?: Invoice) => {
    if (invoice) {
      setEditingId(invoice.id);
      const { id, createdAt, updatedAt, invoiceNumber, ...rest } = invoice;
      setForm(rest);
    } else {
      setEditingId(null);
      setForm(emptyForm(loggedInProfileId || ''));
    }
    setShowForm(true);
  };

  const updateItem = (idx: number, changes: Partial<InvoiceItem>) => {
    setForm((f) => {
      const items = [...f.items];
      const item = { ...items[idx], ...changes };
      const { netTotal, vatTotal, grossTotal } = calculateLineItem(
        item.quantity, item.netUnitPrice, item.vatRate as 0 | 7 | 19
      );
      items[idx] = { ...item, netTotal, vatTotal, grossTotal };
      const totals = calculateInvoiceTotals(items);
      return { ...f, items, ...totals };
    });
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, emptyItem()],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => {
      const items = f.items.filter((_, i) => i !== idx);
      const totals = calculateInvoiceTotals(items);
      return { ...f, items, ...totals };
    });
  };

  const selectArticle = (idx: number, articleId: string) => {
    const article = profileArticles.find((a) => a.id === articleId);
    if (!article) return;
    updateItem(idx, {
      articleId,
      description: article.name + (article.description ? '\n' + article.description : ''),
      unit: article.unit,
      netUnitPrice: article.netPrice,
      vatRate: article.vatRate,
    });
  };

  const handleSave = () => {
    if (!form.profileId || !form.customerId) return;
    if (editingId) {
      updateInvoice(editingId, form);
    } else {
      addInvoice(form);
    }
    setShowForm(false);
  };

  const handlePDF = (invoice: Invoice) => {
    const profile = profiles.find((p) => p.id === invoice.profileId);
    const customer = customers.find((c) => c.id === invoice.customerId) || null;
    if (profile) generateInvoicePDF(invoice, profile, customer);
  };

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.internalName || '-';
  const customerName = (id: string) => customers.find((c) => c.id === id)?.companyName || '-';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} Rechnungen</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neue Rechnung
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        {profiles.length > 1 && (
          <select
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Alle</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.internalName}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="Noch keine Rechnungen"
          description="Erstellen Sie Ihre erste Rechnung."
          action={{ label: '+ Neue Rechnung', onClick: () => openForm() }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              customerName={customerName(inv.customerId)}
              profileName={profileName(inv.profileId)}
              onEdit={() => openForm(inv)}
              onDelete={() => setDeleteId(inv.id)}
              onDuplicate={() => duplicateInvoice(inv.id)}
              onPDF={() => handlePDF(inv)}
              onMarkPaid={() => updateInvoice(inv.id, { status: 'paid' })}
              onMarkOpen={() => updateInvoice(inv.id, { status: 'open' })}
            />
          ))}
        </div>
      )}

      {/* Invoice Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
        size="full"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button variant="outline" onClick={() => { setForm((f) => ({ ...f, status: 'draft' })); handleSave(); }}>
              Als Entwurf
            </Button>
            <Button
              fullWidth
              onClick={handleSave}
              disabled={!form.profileId || !form.customerId || form.items.length === 0}
            >
              {editingId ? 'Speichern' : 'Rechnung erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Profil" required>
              <Select
                value={form.profileId}
                onChange={(e) => setForm({ ...form, profileId: e.target.value, customerId: '' })}
              >
                <option value="">Profil wählen...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.internalName}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Kunde" required>
              <Select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                disabled={!form.profileId}
              >
                <option value="">Kunde wählen...</option>
                {profileCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Rechnungsdatum">
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              />
            </FormField>

            <FormField label="Fällig am">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </FormField>

            <FormField label="Leistungszeitraum">
              <Input
                value={form.servicePeriod}
                onChange={(e) => setForm({ ...form, servicePeriod: e.target.value })}
                placeholder="z.B. Januar 2025"
              />
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Intro text */}
          <TemplateTextSelector
            label="Auftragstext / Einleitung"
            type="invoice_intro"
            profileId={form.profileId || null}
            value={form.introText}
            onChange={(v) => setForm({ ...form, introText: v })}
            placeholder="Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:"
          />

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Positionen</h3>
              <Button size="sm" variant="secondary" icon={<Plus className="w-3 h-3" />} onClick={addItem}>
                Position
              </Button>
            </div>

            {form.items.length === 0 ? (
              <div
                onClick={addItem}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Klicken um Position hinzuzufügen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-slate-400 mt-1">#{idx + 1}</span>
                      <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {profileArticles.length > 0 && (
                      <div className="mb-3">
                        <Select
                          value={item.articleId || ''}
                          onChange={(e) => selectArticle(idx, e.target.value)}
                        >
                          <option value="">Artikel wählen (optional)...</option>
                          {profileArticles.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </Select>
                      </div>
                    )}

                    <FormField label="Beschreibung">
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Leistungsbeschreibung..."
                        rows={2}
                      />
                    </FormField>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <FormField label="Menge">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </FormField>
                      <FormField label="Einheit">
                        <Select
                          value={item.unit}
                          onChange={(e) => updateItem(idx, { unit: e.target.value })}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Einzelpreis (Netto)">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.netUnitPrice}
                          onChange={(e) => updateItem(idx, { netUnitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </FormField>
                      <FormField label="MwSt.">
                        <Select
                          value={item.vatRate}
                          onChange={(e) => updateItem(idx, { vatRate: parseInt(e.target.value) as 0 | 7 | 19 })}
                        >
                          {VAT_RATES.map((r) => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    <div className="flex justify-end mt-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Gesamt (Netto): {formatCurrency(item.netTotal)}
                      </span>
                    </div>
                  </div>
                ))}

                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={addItem}
                  fullWidth
                >
                  Weitere Position
                </Button>
              </div>
            )}
          </div>

          {/* Totals */}
          {form.items.length > 0 && (
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Nettobetrag</span>
                  <span>{formatCurrency(form.netTotal)}</span>
                </div>
                {form.vatTotals.map((vt) => (
                  <div key={vt.rate} className="flex justify-between text-sm text-slate-700">
                    <span>MwSt. {vt.rate}%</span>
                    <span>{formatCurrency(vt.amount)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-brand-200 flex justify-between font-bold text-base text-slate-900">
                  <span>Gesamtbetrag</span>
                  <span className="text-brand-700">{formatCurrency(form.grossTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment text */}
          <TemplateTextSelector
            label="Zahlungsanweisung"
            type="invoice_payment"
            profileId={form.profileId || null}
            value={form.paymentText}
            onChange={(v) => setForm({ ...form, paymentText: v })}
            placeholder="Zahlbar per Überweisung innerhalb von 14 Tagen unter Angabe der Rechnungsnummer..."
          />

          {/* Notes */}
          <FormField label="Interne Notizen">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Nur intern sichtbar..."
              rows={2}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteInvoice(deleteId); }}
        title="Rechnung löschen"
        message="Möchten Sie diese Rechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}

interface InvoiceCardProps {
  invoice: Invoice;
  customerName: string;
  profileName: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPDF: () => void;
  onMarkPaid: () => void;
  onMarkOpen: () => void;
}

function InvoiceCard({
  invoice, customerName, profileName,
  onEdit, onDelete, onDuplicate, onPDF, onMarkPaid, onMarkOpen,
}: InvoiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500 truncate">{customerName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-44">
                      <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Edit2 className="w-4 h-4" /> Bearbeiten
                      </button>
                      <button onClick={() => { onPDF(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Download className="w-4 h-4" /> PDF exportieren
                      </button>
                      <button onClick={() => { onDuplicate(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Copy className="w-4 h-4" /> Duplizieren
                      </button>
                      {invoice.status !== 'paid' && (
                        <button onClick={() => { onMarkPaid(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50">
                          <CheckCircle className="w-4 h-4" /> Als bezahlt markieren
                        </button>
                      )}
                      {invoice.status === 'paid' && (
                        <button onClick={() => { onMarkOpen(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50">
                          <XCircle className="w-4 h-4" /> Als offen markieren
                        </button>
                      )}
                      <div className="my-1 border-t border-slate-100" />
                      <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Löschen
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">{formatDate(invoice.invoiceDate)}</span>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(invoice.grossTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
