import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, LayoutTemplate, Edit2, Trash2, Star, StarOff,
  Paperclip, Upload, Download, Mail, MessageCircle, FileText, Image, File,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Template, TemplateType, Attachment } from '../types';
import { getTemplateTypeLabel, downloadBlob, shareFileNative } from '../utils/helpers';

type PageTab = 'vorlagen' | 'anlagen';

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: 'invoice_intro', label: 'Auftragstext (Rechnung)' },
  { value: 'invoice_payment', label: 'Zahlungsanweisung (Rechnung)' },
  { value: 'delivery_intro', label: 'Auftragstext (Lieferschein)' },
  { value: 'delivery_note', label: 'Hinweistext (Lieferschein)' },
  { value: 'letter', label: 'Anschreiben / Schreiben' },
  { value: 'footer', label: 'Fußzeile' },
];

interface TemplateFormData {
  profileId: string | null;
  type: TemplateType;
  name: string;
  content: string;
  isDefault: boolean;
}

const emptyForm: TemplateFormData = {
  profileId: null,
  type: 'invoice_intro',
  name: '',
  content: '',
  isDefault: false,
};

export default function Templates() {
  const [activeTab, setActiveTab] = useState<PageTab>('vorlagen');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vorlagen</h1>
        <p className="text-sm text-slate-500 mt-0.5">Textvorlagen und Dateianlagen</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('vorlagen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'vorlagen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Vorlagen
        </button>
        <button
          onClick={() => setActiveTab('anlagen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'anlagen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          Anlagen
        </button>
      </div>

      {activeTab === 'vorlagen' && <VorlagenTab />}
      {activeTab === 'anlagen' && <AnlagenTab />}
    </div>
  );
}

// ─── Vorlagen Tab ─────────────────────────────────────────────────────────────

function VorlagenTab() {
  const { profiles, loggedInProfileId, templates, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [filterType, setFilterType] = useState<TemplateType | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>({ ...emptyForm, profileId: loggedInProfileId });

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (t.profileId !== null && t.profileId !== loggedInProfileId) return false;
      return !filterType || t.type === filterType;
    });
  }, [templates, filterType, loggedInProfileId]);

  const grouped = useMemo(() => {
    const map: Record<string, Template[]> = {};
    filtered.forEach((t) => {
      const key = getTemplateTypeLabel(t.type);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [filtered]);

  const openForm = (template?: Template) => {
    if (template) {
      setEditingId(template.id);
      setForm({ profileId: template.profileId, type: template.type, name: template.name, content: template.content, isDefault: template.isDefault });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, profileId: loggedInProfileId });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.content.trim()) return;
    if (editingId) { updateTemplate(editingId, form); } else { addTemplate(form); }
    setShowForm(false);
  };

  const profileName = (id: string | null) =>
    id ? profiles.find((p) => p.id === id)?.internalName || 'Profil' : 'Global';

  return (
    <>
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TemplateType | '')}
          className="h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Alle Typen</option>
          {TEMPLATE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neue Vorlage
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="w-8 h-8" />}
          title="Noch keine Vorlagen"
          description="Erstellen Sie Textvorlagen für Rechnungen, Lieferscheine und Schreiben."
          action={{ label: '+ Neue Vorlage', onClick: () => openForm() }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{type}</h2>
              <div className="space-y-2">
                {items.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    profileName={profileName(tpl.profileId)}
                    onEdit={() => openForm(tpl)}
                    onDelete={() => setDeleteId(tpl.id)}
                    onToggleDefault={() => updateTemplate(tpl.id, { isDefault: !tpl.isDefault })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Vorlage bearbeiten' : 'Neue Vorlage'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.name.trim() || !form.content.trim()}>
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Vorlagentyp" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TemplateType })}>
              {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Vorlagenname" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Standard Auftragstext" />
          </FormField>
          <FormField label="Profil-Zuordnung">
            <Select value={form.profileId || ''} onChange={(e) => setForm({ ...form, profileId: e.target.value || null })}>
              <option value="">Global (alle Profile)</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}
            </Select>
          </FormField>
          <FormField label="Inhalt" required>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Vorlagetext..." rows={6} />
          </FormField>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 rounded accent-brand-600" />
            <span className="text-sm text-slate-700">Als Standardvorlage markieren</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteTemplate(deleteId); }}
        title="Vorlage löschen"
        message="Möchten Sie diese Vorlage wirklich löschen?"
      />
    </>
  );
}

// ─── Anlagen Tab ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-purple-500" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AnlagenTab() {
  const { loggedInProfileId, attachments, addAttachment, deleteAttachment } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [shareItem, setShareItem] = useState<Attachment | null>(null);
  const [shareEmail, setShareEmail] = useState('');

  const myAttachments = attachments.filter((a) => a.profileId === loggedInProfileId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" ist zu groß (max. 5 MB).`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        addAttachment({
          profileId: loggedInProfileId!,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          data: ev.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDownload = (att: Attachment) => {
    fetch(att.data)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(new Blob([blob], { type: att.mimeType || blob.type }), att.name))
      .catch(() => {
        const a = document.createElement('a');
        a.href = att.data;
        a.download = att.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  const handleShareNative = (att: Attachment) => {
    fetch(att.data)
      .then((r) => r.blob())
      .then((blob) => shareFileNative(new Blob([blob], { type: att.mimeType || blob.type }), att.name))
      .then((handled) => {
        if (!handled) alert('Teilen wird auf diesem Gerät nicht unterstützt. Bitte laden Sie die Datei herunter.');
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{myAttachments.length} Dateien hochgeladen</p>
        <Button icon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
          Datei hochladen
        </Button>
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="*/*" />
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      )}

      {myAttachments.length === 0 ? (
        <EmptyState
          icon={<Paperclip className="w-8 h-8" />}
          title="Noch keine Anlagen"
          description="Laden Sie Dateien hoch (Bilder, PDFs, Dokumente). Max. 5 MB pro Datei."
          action={{ label: 'Datei hochladen', onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <div className="space-y-2">
          {myAttachments.map((att) => (
            <div key={att.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {fileIcon(att.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate text-sm">{att.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(att.size)} · {new Date(att.createdAt).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(att)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600"
                    title="Herunterladen"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setShareItem(att); setShareEmail(''); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600"
                    title="Teilen"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(att.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share modal */}
      <Modal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Teilen: ${shareItem?.name}`}
        size="sm"
        footer={
          <Button variant="secondary" fullWidth onClick={() => setShareItem(null)}>Schließen</Button>
        }
      >
        {shareItem && (
          <div className="space-y-3">
            <button
              onClick={() => handleShareNative(shareItem)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Teilen (WhatsApp, Mail, AirDrop …)
            </button>
            <button
              onClick={() => handleDownload(shareItem)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Herunterladen / In Dateien sichern
            </button>
            <p className="text-xs text-slate-400 text-center">
              "Teilen" öffnet das Systemmenü — die Datei wird direkt angehängt
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteAttachment(deleteId); setDeleteId(null); }}
        title="Datei löschen"
        message="Möchten Sie diese Datei wirklich löschen?"
      />
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: Template;
  profileName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDefault: () => void;
}

function TemplateCard({ template, profileName, onEdit, onDelete, onToggleDefault }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          <LayoutTemplate className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 truncate">{template.name}</p>
                {template.isDefault && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{getTemplateTypeLabel(template.type)} · {profileName}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 mt-2">{template.content}</p>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={onToggleDefault} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors">
              {template.isDefault ? <><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Standard</> : <><StarOff className="w-3.5 h-3.5" /> Als Standard</>}
            </button>
            <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-700 transition-colors ml-2">
              <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors ml-auto">
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
