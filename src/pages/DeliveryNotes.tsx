import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Truck, MoreVertical, Edit2, Trash2,
  Download, Package, Trash, RefreshCw,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import TemplateTextSelector from '../components/templates/TemplateTextSelector';
import { DeliveryNote, DeliveryNoteItem, DeliveryNoteStatus } from '../types';
import {
  formatDate, getStatusColor, getStatusLabel, generateId, todayISO,
} from '../utils/helpers';
import { generateDeliveryNotePDF } from '../utils/pdf';

const UNITS = ['Stk.', 'Karton', 'Palette', 'kg', 'Liter', 'm', 'm²', 'Pauschal'];
const STATUSES: { value: DeliveryNoteStatus; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'sent', label: 'Gesendet' },
  { value: 'delivered', label: 'Geliefert' },
];

type DNFormData = Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt' | 'deliveryNoteNumber'>;

function emptyForm(profileId: string): DNFormData {
  return {
    profileId,
    customerId: '',
    deliveryDate: todayISO(),
    status: 'draft',
    introText: '',
    noteText: '',
    paymentText: '',
    items: [],
  };
}

function emptyItem(): DeliveryNoteItem {
  return {
    id: generateId(),
    articleId: null,
    description: '',
    quantity: 1,
    unit: 'Stk.',
    notes: '',
  };
}

export default function DeliveryNotes() {
  const {
    profiles, loggedInProfileId, customers, deliveryNotes, articles,
    addDeliveryNote, updateDeliveryNote, deleteDeliveryNote,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<DNFormData>(emptyForm(loggedInProfileId || ''));

  const profileCustomers = useMemo(
    () => customers.filter((c) => c.profileId === form.profileId),
    [customers, form.profileId]
  );

  const profileArticles = useMemo(
    () => articles.filter((a) => a.profileId === null || a.profileId === form.profileId),
    [articles, form.profileId]
  );

  const filtered = useMemo(() => {
    return deliveryNotes.filter((n) => {
      const matchProfile = filterProfile ? n.profileId === filterProfile : true;
      const q = search.toLowerCase();
      const customer = customers.find((c) => c.id === n.customerId);
      const matchSearch =
        !search ||
        n.deliveryNoteNumber.toLowerCase().includes(q) ||
        customer?.companyName.toLowerCase().includes(q);
      return matchProfile && matchSearch;
    });
  }, [deliveryNotes, customers, search, filterProfile]);

  const openForm = (note?: DeliveryNote) => {
    if (note) {
      setEditingId(note.id);
      const { id, createdAt, updatedAt, deliveryNoteNumber, ...rest } = note;
      setForm(rest);
    } else {
      setEditingId(null);
      setForm(emptyForm(loggedInProfileId || ''));
    }
    setShowForm(true);
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateItem = (idx: number, changes: Partial<DeliveryNoteItem>) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...changes };
      return { ...f, items };
    });
  };

  const selectArticle = (idx: number, articleId: string) => {
    const article = profileArticles.find((a) => a.id === articleId);
    if (!article) return;
    updateItem(idx, {
      articleId,
      description: article.name,
      unit: article.unit,
    });
  };

  const handleSave = () => {
    if (!form.profileId || !form.customerId) return;
    if (editingId) {
      updateDeliveryNote(editingId, form);
    } else {
      addDeliveryNote(form);
    }
    setShowForm(false);
  };

  const handlePDF = (note: DeliveryNote) => {
    const profile = profiles.find((p) => p.id === note.profileId);
    const customer = customers.find((c) => c.id === note.customerId) || null;
    if (profile) generateDeliveryNotePDF(note, profile, customer);
  };

  const customerName = (id: string) => customers.find((c) => c.id === id)?.companyName || '-';
  const profileName = (id: string) => profiles.find((p) => p.id === id)?.internalName || '-';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lieferscheine</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} Lieferscheine</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neuer Lieferschein
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
          icon={<Truck className="w-8 h-8" />}
          title="Noch keine Lieferscheine"
          description="Erstellen Sie Ihren ersten Lieferschein."
          action={{ label: '+ Neuer Lieferschein', onClick: () => openForm() }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => (
            <DNCard
              key={note.id}
              note={note}
              customerName={customerName(note.customerId)}
              profileName={profileName(note.profileId)}
              onEdit={() => openForm(note)}
              onDelete={() => setDeleteId(note.id)}
              onPDF={() => handlePDF(note)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Lieferschein bearbeiten' : 'Neuer Lieferschein'}
        size="full"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button
              fullWidth
              onClick={handleSave}
              disabled={!form.profileId || !form.customerId}
            >
              {editingId ? 'Speichern' : 'Lieferschein erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
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
              <div className="flex gap-2">
                <Select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  disabled={!form.profileId}
                  className="flex-1"
                >
                  <option value="">Kunde wählen...</option>
                  {profileCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </Select>
                {form.customerId && (
                  <button
                    onClick={() => setForm({ ...form, customerId: '' })}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-400"
                    title="Auswahl zurücksetzen"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </FormField>

            <FormField label="Lieferdatum">
              <Input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              />
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DeliveryNoteStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Intro text */}
          <TemplateTextSelector
            label="Auftragstext"
            type="delivery_intro"
            profileId={form.profileId || null}
            value={form.introText}
            onChange={(v) => setForm({ ...form, introText: v })}
            placeholder="Wir liefern Ihnen hiermit folgende Artikel:"
          />

          {/* Articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Artikel</h3>
              <Button size="sm" variant="secondary" icon={<Plus className="w-3 h-3" />} onClick={addItem}>
                Artikel
              </Button>
            </div>

            {form.items.length === 0 ? (
              <div
                onClick={addItem}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <Package className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Klicken um Artikel hinzuzufügen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400">Artikel #{idx + 1}</span>
                      <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {profileArticles.length > 0 && (
                      <div className="mb-3">
                        <Select
                          value={item.articleId || ''}
                          onChange={(e) => selectArticle(idx, e.target.value)}
                        >
                          <option value="">Artikel aus Bibliothek wählen...</option>
                          {profileArticles.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </Select>
                      </div>
                    )}

                    <FormField label="Bezeichnung">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Artikelbezeichnung..."
                      />
                    </FormField>

                    <div className="grid grid-cols-3 gap-3 mt-3">
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
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </Select>
                      </FormField>
                      <FormField label="Bemerkung">
                        <Input
                          value={item.notes}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })}
                          placeholder="Optional..."
                        />
                      </FormField>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="secondary" icon={<Plus className="w-3 h-3" />} onClick={addItem} fullWidth>
                  Weiterer Artikel
                </Button>
              </div>
            )}
          </div>

          {/* Note text */}
          <TemplateTextSelector
            label="Hinweistext"
            type="delivery_note"
            profileId={form.profileId || null}
            value={form.noteText}
            onChange={(v) => setForm({ ...form, noteText: v })}
            placeholder="Hinweise zur Lieferung..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteDeliveryNote(deleteId); }}
        title="Lieferschein löschen"
        message="Möchten Sie diesen Lieferschein wirklich löschen?"
      />
    </div>
  );
}

interface DNCardProps {
  note: DeliveryNote;
  customerName: string;
  profileName: string;
  onEdit: () => void;
  onDelete: () => void;
  onPDF: () => void;
}

function DNCard({ note, customerName, profileName, onEdit, onDelete, onPDF }: DNCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{note.deliveryNoteNumber}</p>
              <p className="text-sm text-slate-500 truncate">{customerName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(note.status)}`}>
                {getStatusLabel(note.status)}
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
                    <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-40">
                      <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Edit2 className="w-4 h-4" /> Bearbeiten
                      </button>
                      <button onClick={() => { onPDF(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Download className="w-4 h-4" /> PDF
                      </button>
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
            <span className="text-xs text-slate-400">{formatDate(note.deliveryDate)}</span>
            <span className="text-xs text-slate-400">{note.items.length} Artikel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
