import React, { useState, useMemo } from 'react';
import { Plus, LayoutTemplate, Edit2, Trash2, Star, StarOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Template, TemplateType } from '../types';
import { getTemplateTypeLabel } from '../utils/helpers';

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
  const { profiles, activeProfileId, templates, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [filterType, setFilterType] = useState<TemplateType | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>({ ...emptyForm, profileId: activeProfileId });

  const filtered = useMemo(() => {
    return templates.filter((t) => !filterType || t.type === filterType);
  }, [templates, filterType]);

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
      setForm({
        profileId: template.profileId,
        type: template.type,
        name: template.name,
        content: template.content,
        isDefault: template.isDefault,
      });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, profileId: activeProfileId });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.content.trim()) return;
    if (editingId) {
      updateTemplate(editingId, form);
    } else {
      addTemplate(form);
    }
    setShowForm(false);
  };

  const toggleDefault = (id: string, current: boolean) => {
    updateTemplate(id, { isDefault: !current });
  };

  const profileName = (id: string | null) =>
    id ? profiles.find((p) => p.id === id)?.internalName || 'Profil' : 'Global';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vorlagen</h1>
          <p className="text-sm text-slate-500 mt-0.5">{templates.length} Vorlagen</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neue Vorlage
        </Button>
      </div>

      {/* Filter */}
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
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {type}
              </h2>
              <div className="space-y-2">
                {items.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    profileName={profileName(tpl.profileId)}
                    onEdit={() => openForm(tpl)}
                    onDelete={() => setDeleteId(tpl.id)}
                    onToggleDefault={() => toggleDefault(tpl.id, tpl.isDefault)}
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
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TemplateType })}
            >
              {TEMPLATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Vorlagenname" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Standard Auftragstext"
            />
          </FormField>

          <FormField label="Profil-Zuordnung">
            <Select
              value={form.profileId || ''}
              onChange={(e) => setForm({ ...form, profileId: e.target.value || null })}
            >
              <option value="">Global (alle Profile)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.internalName}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Inhalt" required>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Vorlagetext..."
              rows={6}
            />
          </FormField>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-600"
            />
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
    </div>
  );
}

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
                {template.isDefault && (
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {getTemplateTypeLabel(template.type)} · {profileName}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 mt-2">{template.content}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onToggleDefault}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors"
            >
              {template.isDefault ? (
                <><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Standard</>
              ) : (
                <><StarOff className="w-3.5 h-3.5" /> Als Standard</>
              )}
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
