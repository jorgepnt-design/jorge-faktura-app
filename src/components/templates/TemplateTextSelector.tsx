import React, { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TemplateType } from '../../types';
import { Textarea } from '../common/FormField';
import Button from '../common/Button';

interface TemplateTextSelectorProps {
  label: string;
  type: TemplateType;
  profileId: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TemplateTextSelector({
  label,
  type,
  profileId,
  value,
  onChange,
  placeholder,
}: TemplateTextSelectorProps) {
  const { templates, addTemplate } = useStore();
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const relevantTemplates = templates.filter(
    (t) => t.type === type && (t.profileId === null || t.profileId === profileId)
  );

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const tpl = templates.find((t) => t.id === id);
    if (tpl) onChange(tpl.content);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    addTemplate({
      profileId,
      type,
      name: saveName.trim(),
      content: value,
      isDefault: false,
    });
    setSaveName('');
    setShowSave(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={() => setShowSave((s) => !s)}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          Als Vorlage speichern
        </button>
      </div>

      {relevantTemplates.length > 0 && (
        <div className="relative">
          <select
            onChange={handleSelect}
            defaultValue=""
            className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none"
          >
            <option value="">Vorlage wählen...</option>
            {relevantTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />

      {showSave && (
        <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Vorlagenname..."
            className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <Button size="sm" onClick={handleSave} disabled={!saveName.trim()}>
            Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
