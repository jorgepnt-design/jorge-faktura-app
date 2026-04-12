import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon, User, Package, Shield, Database,
  Upload, Trash2, Copy, Plus, Eye, EyeOff, Download, CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Profile } from '../types';

type Tab = 'profil' | 'artikel' | 'freigaben' | 'datenrettung';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'profil', label: 'Profil', icon: <User className="w-4 h-4" /> },
    { value: 'artikel', label: 'Artikel', icon: <Package className="w-4 h-4" /> },
    { value: 'freigaben', label: 'Freigaben', icon: <Shield className="w-4 h-4" /> },
    { value: 'datenrettung', label: 'Daten', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-sm text-slate-500 mt-0.5">App-Konfiguration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profil' && <ProfileTab />}
      {activeTab === 'artikel' && <ArticleTab />}
      {activeTab === 'freigaben' && <FreigabenTab />}
      {activeTab === 'datenrettung' && <DatenrettungTab />}
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const {
    profiles, activeProfileId, addProfile, updateProfile,
    deleteProfile, duplicateProfile, setActiveProfile, settings, updatePin,
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const handleSavePin = () => {
    if (pin.length < 4) { setPinError('Mindestens 4 Zeichen'); return; }
    if (pin !== pinConfirm) { setPinError('PINs stimmen nicht überein'); return; }
    updatePin(pin);
    setPin(''); setPinConfirm(''); setPinError(''); setShowPinForm(false);
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Profile list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Profile</h2>
          <Button
            size="sm"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => {
              const p = addProfile({
                internalName: 'Neues Profil',
                companyName: '', personName: '', address: '', zipCode: '',
                city: '', country: 'Deutschland', email: '', phone: '',
                mobile: '', website: '', taxNumber: '', vatId: '',
                bankName: '', iban: '', bic: '',
                paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
                logo: null, pdfFooter: '',
              });
              setEditingId(p.id);
            }}
          >
            Hinzufügen
          </Button>
        </div>
        <div className="divide-y divide-slate-50">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center gap-3 p-4">
              {profile.logo ? (
                <img src={profile.logo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {profile.internalName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{profile.internalName}</p>
                {profile.companyName && (
                  <p className="text-xs text-slate-400 truncate">{profile.companyName}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {profile.id === activeProfileId && (
                  <span className="text-xs text-brand-600 font-medium px-2 py-0.5 bg-brand-50 rounded-full">Aktiv</span>
                )}
                {profile.id !== activeProfileId && (
                  <button
                    onClick={() => setActiveProfile(profile.id)}
                    className="text-xs text-slate-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50"
                  >
                    Aktivieren
                  </button>
                )}
                <button onClick={() => setEditingId(profile.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                  <SettingsIcon className="w-4 h-4" />
                </button>
                <button onClick={() => duplicateProfile(profile.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                  <Copy className="w-4 h-4" />
                </button>
                {profiles.length > 1 && (
                  <button onClick={() => setDeleteId(profile.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PIN */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">PIN ändern</h2>
            <p className="text-xs text-slate-400 mt-0.5">App-Anmelde-PIN</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowPinForm(!showPinForm)}>
            {showPinForm ? 'Abbrechen' : 'Ändern'}
          </Button>
        </div>
        {showPinForm && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                placeholder="Neuer PIN"
                maxLength={20}
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              type="password"
              value={pinConfirm}
              onChange={(e) => { setPinConfirm(e.target.value); setPinError(''); }}
              placeholder="PIN wiederholen"
              maxLength={20}
            />
            {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            <Button fullWidth onClick={handleSavePin}>PIN speichern</Button>
          </div>
        )}
        {pinSuccess && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> PIN erfolgreich geändert
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editingId && (
        <ProfileEditModal
          profileId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteProfile(deleteId); }}
        title="Profil löschen"
        message="Möchten Sie dieses Profil wirklich löschen? Alle zugehörigen Daten bleiben erhalten."
      />
    </div>
  );
}

// ─── Profile Edit Modal ───────────────────────────────────────────────────────

interface ProfileEditModalProps {
  profileId: string;
  onClose: () => void;
}

function ProfileEditModal({ profileId, onClose }: ProfileEditModalProps) {
  const { profiles, updateProfile } = useStore();
  const profile = profiles.find((p) => p.id === profileId);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profileId]);

  if (!form) return null;

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm((f) => f ? { ...f, logo: result } : f);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfile(profileId, form);
    onClose();
  };

  const f = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => prev ? { ...prev, [key]: e.target.value } : prev);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Profil bearbeiten"
      size="full"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button fullWidth onClick={handleSave}>Speichern</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Firmenlogo</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" icon={<Upload className="w-3 h-3" />} onClick={() => logoInputRef.current?.click()}>
                Hochladen
              </Button>
              {form.logo && (
                <Button size="sm" variant="ghost" onClick={() => setForm((f) => f ? { ...f, logo: null } : f)}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">PNG, JPG · max. 2 MB</p>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Profilname (intern)" required>
            <Input value={form.internalName} onChange={f('internalName')} placeholder="Mein Profil" />
          </FormField>
          <FormField label="Firmenname">
            <Input value={form.companyName} onChange={f('companyName')} placeholder="Muster GmbH" />
          </FormField>
          <FormField label="Ansprechpartner / Person">
            <Input value={form.personName} onChange={f('personName')} placeholder="Max Mustermann" />
          </FormField>
          <FormField label="Adresse">
            <Input value={form.address} onChange={f('address')} placeholder="Musterstraße 1" />
          </FormField>
          <FormField label="PLZ">
            <Input value={form.zipCode} onChange={f('zipCode')} placeholder="12345" maxLength={10} />
          </FormField>
          <FormField label="Stadt">
            <Input value={form.city} onChange={f('city')} placeholder="Berlin" />
          </FormField>
          <FormField label="Land">
            <Input value={form.country} onChange={f('country')} placeholder="Deutschland" />
          </FormField>
          <FormField label="E-Mail">
            <Input type="email" value={form.email} onChange={f('email')} placeholder="info@firma.de" />
          </FormField>
          <FormField label="Telefon">
            <Input type="tel" value={form.phone} onChange={f('phone')} placeholder="+49 30 123456" />
          </FormField>
          <FormField label="Mobil">
            <Input type="tel" value={form.mobile} onChange={f('mobile')} placeholder="+49 151 123456" />
          </FormField>
          <FormField label="Website">
            <Input value={form.website} onChange={f('website')} placeholder="www.firma.de" />
          </FormField>
          <FormField label="Steuernummer">
            <Input value={form.taxNumber} onChange={f('taxNumber')} placeholder="12/345/67890" />
          </FormField>
          <FormField label="USt-IdNr.">
            <Input value={form.vatId} onChange={f('vatId')} placeholder="DE123456789" />
          </FormField>
          <FormField label="Bankname">
            <Input value={form.bankName} onChange={f('bankName')} placeholder="Deutsche Bank" />
          </FormField>
          <FormField label="IBAN">
            <Input value={form.iban} onChange={f('iban')} placeholder="DE00 1234 5678 9012 3456 78" />
          </FormField>
          <FormField label="BIC">
            <Input value={form.bic} onChange={f('bic')} placeholder="DEUTDEDB" />
          </FormField>
          <FormField label="Zahlungsbedingungen" className="sm:col-span-2">
            <Input value={form.paymentTerms} onChange={f('paymentTerms')} placeholder="Zahlbar innerhalb von 14 Tagen..." />
          </FormField>
          <FormField label="PDF-Fußzeile" className="sm:col-span-2">
            <textarea
              value={form.pdfFooter}
              onChange={(e) => setForm((f) => f ? { ...f, pdfFooter: e.target.value } : f)}
              placeholder="Text für die Fußzeile in PDFs..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

// ─── Article Tab ──────────────────────────────────────────────────────────────

function ArticleTab() {
  const { profiles, activeProfileId, articles, addArticle, updateArticle, deleteArticle } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    profileId: activeProfileId as string | null,
    name: '',
    description: '',
    unit: 'Stk.',
    netPrice: 0,
    vatRate: 19 as 0 | 7 | 19,
  });

  const openForm = (article?: typeof articles[0]) => {
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
      setForm({ profileId: activeProfileId as string | null, name: '', description: '', unit: 'Stk.', netPrice: 0, vatRate: 19 });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateArticle(editingId, form);
    } else {
      addArticle(form);
    }
    setShowForm(false);
  };

  const profileName = (id: string | null) =>
    id ? profiles.find((p) => p.id === id)?.internalName || 'Profil' : 'Global';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Artikelbibliothek</h2>
        <Button size="sm" icon={<Plus className="w-3 h-3" />} onClick={() => openForm()}>
          Artikel
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Noch keine Artikel</p>
          <Button size="sm" className="mt-3" onClick={() => openForm()}>+ Artikel hinzufügen</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{article.name}</p>
                  <p className="text-xs text-slate-400">
                    {article.netPrice.toFixed(2)} € / {article.unit} · MwSt. {article.vatRate}% · {profileName(article.profileId)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openForm(article)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(article.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Artikel bearbeiten' : 'Neuer Artikel'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Profil">
            <Select value={form.profileId || ''} onChange={(e) => setForm({ ...form, profileId: e.target.value || null })}>
              <option value="">Global (alle Profile)</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.internalName}</option>)}
            </Select>
          </FormField>
          <FormField label="Artikelname" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Webentwicklung" />
          </FormField>
          <FormField label="Beschreibung">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Einheit">
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['Stk.', 'Std.', 'Tage', 'km', 'Pauschal', 'm²', 'Liter', 'kg'].map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>
            <FormField label="Preis (Netto)">
              <Input type="number" min="0" step="0.01" value={form.netPrice} onChange={(e) => setForm({ ...form, netPrice: parseFloat(e.target.value) || 0 })} />
            </FormField>
            <FormField label="MwSt.">
              <Select value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: parseInt(e.target.value) as 0 | 7 | 19 })}>
                {[0, 7, 19].map((r) => <option key={r} value={r}>{r}%</option>)}
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>

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

// ─── Freigaben Tab ────────────────────────────────────────────────────────────

function FreigabenTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h2 className="font-semibold text-slate-700 mb-2">Freigaben & Zusammenarbeit</h2>
      <p className="text-sm text-slate-400 max-w-xs mx-auto">
        Diese Funktion (Teamzugang, Benutzerrollen, Freigabelinks) ist für eine zukünftige Version geplant.
      </p>
      <span className="inline-block mt-3 text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
        Demnächst verfügbar
      </span>
    </div>
  );
}

// ─── Datenrettung Tab ─────────────────────────────────────────────────────────

function DatenrettungTab() {
  const { exportData, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jorge-faktura-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const ok = importData(json);
      setImportMsg(ok ? 'Import erfolgreich!' : 'Fehler beim Import. Bitte gültige Backup-Datei wählen.');
      setTimeout(() => setImportMsg(''), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-1">Daten exportieren</h2>
        <p className="text-sm text-slate-400 mb-4">
          Exportieren Sie alle Ihre Daten als JSON-Datei zur Sicherung.
        </p>
        <Button icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Backup exportieren
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-1">Daten importieren</h2>
        <p className="text-sm text-slate-400 mb-4">
          Stellen Sie einen vorherigen Backup wieder her. Achtung: Dies überschreibt alle aktuellen Daten.
        </p>
        <Button
          variant="outline"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Backup importieren
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        {importMsg && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${importMsg.includes('Fehler') ? 'text-red-500' : 'text-green-600'}`}>
            {importMsg.includes('Fehler')
              ? <AlertTriangle className="w-4 h-4" />
              : <CheckCircle className="w-4 h-4" />}
            {importMsg}
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Hinweis zur Datensicherung</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Alle Daten werden lokal im Browser gespeichert. Erstellen Sie regelmäßig Backups,
              um Datenverlust beim Löschen des Browser-Caches zu vermeiden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
