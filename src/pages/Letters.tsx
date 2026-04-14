import React, { useState, useMemo } from 'react';
import { Plus, Search, PenLine, MoreVertical, Edit2, Trash2, Download, Share2, Mail, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import TemplateTextSelector from '../components/templates/TemplateTextSelector';
import ShareModal from '../components/common/ShareModal';
import { Letter } from '../types';
import { formatDate, formatCurrency, todayISO } from '../utils/helpers';
import { generateLetterPDF, getLetterPdfBlob } from '../utils/pdf';

type LetterFormData = Omit<Letter, 'id' | 'createdAt' | 'updatedAt'>;

function emptyForm(profileId: string): LetterFormData {
  return {
    profileId,
    customerId: null,
    language: 'de',
    title: '',
    content: '',
    templateId: null,
    letterDate: todayISO(),
  };
}

export default function Letters() {
  const {
    profiles, loggedInProfileId, customers, letters, templates,
    addLetter, updateLetter, deleteLetter,
  } = useStore();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LetterFormData>(emptyForm(loggedInProfileId || ''));
  const [shareBlobUrl, setShareBlobUrl] = useState<string | null>(null);
  const [shareFilename, setShareFilename] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [shareBody, setShareBody] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  const profileCustomers = useMemo(
    () => customers.filter((c) => c.profileId === form.profileId),
    [customers, form.profileId]
  );

  const letterTemplates = useMemo(
    () => templates.filter((t) => t.type === 'letter'),
    [templates]
  );

  const filtered = useMemo(() => {
    return letters.filter((l) => {
      if (l.profileId !== loggedInProfileId) return false;
      const q = search.toLowerCase();
      return !search || l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q);
    });
  }, [letters, search, loggedInProfileId]);

  const openForm = (letter?: Letter) => {
    if (letter) {
      setEditingId(letter.id);
      const { id, createdAt, updatedAt, ...rest } = letter;
      setForm(rest);
    } else {
      setEditingId(null);
      setForm(emptyForm(loggedInProfileId || ''));
    }
    setShowForm(true);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) setForm((f) => ({ ...f, content: tpl.content, templateId }));
  };

  const handleSave = () => {
    if (!form.profileId || !form.title.trim()) return;
    if (editingId) {
      updateLetter(editingId, form);
    } else {
      addLetter(form);
    }
    setShowForm(false);
  };

  const handlePDF = (letter: Letter) => {
    const profile = profiles.find((p) => p.id === letter.profileId);
    if (!profile) return;
    const customer = letter.customerId ? customers.find((c) => c.id === letter.customerId) ?? null : null;
    generateLetterPDF(letter, profile, customer);
  };

  const handleShare = (letter: Letter) => {
    const profile = profiles.find((p) => p.id === letter.profileId);
    if (!profile) return;
    const customer = letter.customerId ? customers.find((c) => c.id === letter.customerId) ?? null : null;
    const blob = getLetterPdfBlob(letter, profile, customer);
    const url = URL.createObjectURL(blob);
    setShareBlobUrl(url);
    setShareFilename(`${letter.title || 'Schreiben'}.pdf`);
    setShareSubject(letter.title || 'Schreiben');
    setShareBody(`Anbei finden Sie das Schreiben: ${letter.title}\n\nMit freundlichen Grüßen\n${profile.personName || profile.companyName}`);
    setShareEmail(customer?.email || '');
  };

  const closeShare = () => { if (shareBlobUrl) URL.revokeObjectURL(shareBlobUrl); setShareBlobUrl(null); };

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.internalName || '-';
  const customerName = (id: string | null) =>
    id ? customers.find((c) => c.id === id)?.companyName || '-' : '-';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schreiben</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} Dokumente</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neues Schreiben
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PenLine className="w-8 h-8" />}
          title="Noch keine Schreiben"
          description="Erstellen Sie Anschreiben, Mahnungen oder Geschäftsbriefe."
          action={{ label: '+ Neues Schreiben', onClick: () => openForm() }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              profileName={profileName(letter.profileId)}
              customerName={customerName(letter.customerId)}
              onEdit={() => openForm(letter)}
              onDelete={() => setDeleteId(letter.id)}
              onPDF={() => handlePDF(letter)}
              onShare={() => handleShare(letter)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Schreiben bearbeiten' : 'Neues Schreiben'}
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.profileId || !form.title.trim()}>
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Profil" required>
              <Select
                value={form.profileId}
                onChange={(e) => setForm({ ...form, profileId: e.target.value, customerId: null })}
              >
                <option value="">Profil wählen...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.internalName}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Empfänger (optional)">
              <Select
                value={form.customerId || ''}
                onChange={(e) => setForm({ ...form, customerId: e.target.value || null })}
                disabled={!form.profileId}
              >
                <option value="">Kein Empfänger</option>
                {profileCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Datum">
              <Input
                type="date"
                value={form.letterDate}
                onChange={(e) => setForm({ ...form, letterDate: e.target.value })}
              />
            </FormField>

            <FormField label="Sprache / Language">
              <Select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as 'de' | 'en' })}
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </Select>
            </FormField>

            <FormField label="Betreff" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z.B. Mahnung, Anschreiben..."
              />
            </FormField>
          </div>

          {letterTemplates.length > 0 && (
            <FormField label="Vorlage laden">
              <Select
                defaultValue=""
                onChange={(e) => { if (e.target.value) applyTemplate(e.target.value); }}
              >
                <option value="">Vorlage wählen...</option>
                {letterTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          <TemplateTextSelector
            label="Inhalt"
            type="letter"
            profileId={form.profileId || null}
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="Sehr geehrte Damen und Herren,&#10;&#10;..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteLetter(deleteId); }}
        title="Schreiben löschen"
        message="Möchten Sie dieses Schreiben wirklich löschen?"
      />

      {/* Share modal */}
      <ShareModal
        isOpen={!!shareBlobUrl}
        onClose={closeShare}
        blobUrl={shareBlobUrl}
        filename={shareFilename}
        subject={shareSubject}
        bodyText={shareBody}
        recipientEmail={shareEmail}
        onEmailChange={setShareEmail}
      />
    </div>
  );
}

interface LetterCardProps {
  letter: Letter;
  profileName: string;
  customerName: string;
  onEdit: () => void;
  onDelete: () => void;
  onPDF: () => void;
  onShare: () => void;
}

function LetterCard({ letter, profileName, customerName, onEdit, onDelete, onPDF, onShare }: LetterCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <PenLine className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{letter.title}</p>
              <p className="text-sm text-slate-500 truncate">
                {profileName}{customerName !== '-' ? ` · ${customerName}` : ''}
              </p>
            </div>
            <div className="relative flex-shrink-0">
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
                      <Download className="w-4 h-4" /> PDF exportieren
                    </button>
                    <button onClick={() => { onShare(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Share2 className="w-4 h-4" /> Teilen
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
          <div className="mt-2">
            <p className="text-xs text-slate-400 line-clamp-2">{letter.content}</p>
          </div>
          <p className="text-xs text-slate-400 mt-1">{formatDate(letter.letterDate)}</p>
        </div>
      </div>
    </div>
  );
}
