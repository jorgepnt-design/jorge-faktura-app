import React, { useState, useMemo } from 'react';
import { Plus, Search, Package, Edit2, Trash2, Tag } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Article } from '../types';
import { formatCurrency } from '../utils/helpers';

const UNITS = ['Stk.', 'Std.', 'Tage', 'km', 'Pauschal', 'm²', 'Liter', 'kg', 'Karton', 'Palette', 'm'];

interface ArticleFormData {
  profileId: string | null;
  name: string;
  description: string;
  unit: string;
  netPrice: number;
  vatRate: 0 | 7 | 19;
}

function emptyForm(profileId: string | null): ArticleFormData {
  return { profileId, name: '', description: '', unit: 'Stk.', netPrice: 0, vatRate: 19 };
}

export default function Articles() {
  const { profiles, loggedInProfileId, articles, addArticle, updateArticle, deleteArticle } = useStore();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleFormData>(emptyForm(loggedInProfileId));

  const myArticles = useMemo(() => {
    const base = articles.filter(
      (a) => a.profileId === null || a.profileId === loggedInProfileId
    );
    const q = search.toLowerCase();
    return !search
      ? base
      : base.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
        );
  }, [articles, loggedInProfileId, search]);

  const openForm = (article?: Article) => {
    if (article) {
      setEditingId(article.id);
      setForm({
        profileId: article.profileId,
        name: article.name,
        description: article.description,
        unit: article.unit,
        netPrice: article.netPrice,
        vatRate: article.vatRate,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm(loggedInProfileId));
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) updateArticle(editingId, form);
    else addArticle(form);
    setShowForm(false);
  };

  const grossPrice = (netPrice: number, vatRate: number) => netPrice * (1 + vatRate / 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Artikel</h1>
          <p className="text-sm text-slate-500 mt-0.5">{myArticles.length} Artikel</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => openForm()}>
          Neuer Artikel
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Artikel suchen..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-3">
        <Tag className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Artikel aus dieser Liste können beim Erstellen eines Lieferscheins direkt ausgewählt werden. Preis und MwSt. werden dann automatisch übernommen.
        </p>
      </div>

      {/* List */}
      {myArticles.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="Noch keine Artikel"
          description="Legen Sie Artikel an, die Sie bei Lieferscheinen schnell auswählen können."
          action={{ label: '+ Neuer Artikel', onClick: () => openForm() }}
        />
      ) : (
        <div className="space-y-2">
          {myArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              grossPrice={grossPrice(article.netPrice, article.vatRate)}
              onEdit={() => openForm(article)}
              onDelete={() => setDeleteId(article.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Artikel bearbeiten' : 'Neuer Artikel'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Artikelname" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Holzpalette, Versandkarton..."
              autoFocus
            />
          </FormField>

          <FormField label="Beschreibung">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optionale Beschreibung..."
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Einheit">
              <Select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>
            <FormField label="Preis (Netto)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.netPrice}
                onChange={(e) => setForm({ ...form, netPrice: parseFloat(e.target.value) || 0 })}
              />
            </FormField>
            <FormField label="MwSt.">
              <Select
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: parseInt(e.target.value) as 0 | 7 | 19 })}
              >
                <option value={0}>0 %</option>
                <option value={7}>7 %</option>
                <option value={19}>19 %</option>
              </Select>
            </FormField>
          </div>

          {/* Live price preview */}
          {form.netPrice > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 flex justify-between text-sm">
              <span className="text-slate-500">Bruttopreis:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(form.netPrice * (1 + form.vatRate / 100))} / {form.unit}
              </span>
            </div>
          )}

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
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteArticle(deleteId); }}
        title="Artikel löschen"
        message="Möchten Sie diesen Artikel wirklich löschen?"
      />
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  grossPrice: number;
  onEdit: () => void;
  onDelete: () => void;
}

function ArticleCard({ article, grossPrice, onEdit, onDelete }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{article.name}</p>
              {article.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{article.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {article.unit}
            </span>
            <span className="text-xs text-slate-500">
              Netto: <span className="font-medium text-slate-700">{formatCurrency(article.netPrice)}</span>
            </span>
            {article.vatRate > 0 && (
              <span className="text-xs text-slate-500">
                Brutto: <span className="font-medium text-slate-700">{formatCurrency(grossPrice)}</span>
              </span>
            )}
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium ml-auto">
              {article.vatRate} % MwSt.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
