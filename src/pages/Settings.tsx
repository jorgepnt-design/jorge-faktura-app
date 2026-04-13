import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, User, Package, Database,
  Upload, Trash2, Copy, Plus, Eye, EyeOff, Download, CheckCircle,
  AlertTriangle, ArrowRight, LogOut,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Profile } from '../types';

type Tab = 'profil' | 'artikel' | 'datenrettung';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'profil', label: 'Profil', icon: <User className="w-4 h-4" /> },
    { value: 'artikel', label: 'Artikel', icon: <Package className="w-4 h-4" /> },
    { value: 'datenrettung', label: 'Daten', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-sm text-slate-500 mt-0.5">App-Konfiguration</p>
      </div>

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
      {activeTab === 'datenrettung' && <DatenrettungTab />}
    </div>
  );
}

// ─── Profil Tab – eigenes Profil bearbeiten + PIN ändern ──────────────────────

function ProfileTab() {
  const { loggedInProfileId, logout, changePassword } = useStore();
  const navigate = useNavigate();
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin]           = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin]   = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [saving, setSaving]     = useState(false);

  const handleSavePin = async () => {
    if (pin.length < 6)             { setPinError('Mindestens 6 Zeichen'); return; }
    if (pin !== pinConfirm)          { setPinError('PINs stimmen nicht überein'); return; }
    setSaving(true);
    const result = await changePassword(pin);
    setSaving(false);
    if (!result.success) { setPinError(result.error || 'Fehler beim Speichern.'); return; }
    setPin(''); setPinConfirm(''); setPinError(''); setShowPinForm(false);
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-4">
      {/* Profil bearbeiten */}
      {loggedInProfileId && <ProfileEditCard profileId={loggedInProfileId} />}

      {/* PIN (Passwort) ändern */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">PIN ändern</h2>
            <p className="text-xs text-slate-400 mt-0.5">Anmelde-PIN für dieses Konto</p>
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
                placeholder="Neuer PIN (mind. 6 Zeichen)"
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
            <Button fullWidth onClick={handleSavePin} disabled={saving}>
              {saving ? 'Wird gespeichert…' : 'PIN speichern'}
            </Button>
          </div>
        )}
        {pinSuccess && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> PIN erfolgreich geändert
          </div>
        )}
      </div>

      {/* Abmelden */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Abmelden</h2>
            <p className="text-xs text-slate-400 mt-0.5">Von diesem Gerät abmelden</p>
          </div>
          <Button size="sm" variant="outline" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Profil-Bearbeitungsformular ───────────────────────────────────────

function ProfileEditCard({ profileId }: { profileId: string }) {
  const { profiles, updateProfile } = useStore();
  const profile = profiles.find((p) => p.id === profileId);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profileId]);

  if (!form || !profile) return null;

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => f ? { ...f, logo: ev.target?.result as string } : f);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfile(profileId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const f = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => prev ? { ...prev, [key]: e.target.value } : prev);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
      <h2 className="font-semibold text-slate-800">Mein Profil</h2>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
          {form.logo
            ? <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
            : <Upload className="w-6 h-6 text-slate-400" />}
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
        <FormField label="Profilname" required>
          <Input value={form.internalName} onChange={f('internalName')} placeholder="Mein Profil" />
        </FormField>
        <FormField label="Firmenname">
          <Input value={form.companyName} onChange={f('companyName')} placeholder="Muster GmbH" />
        </FormField>
        <FormField label="Ansprechpartner / Person">
          <Input value={form.personName} onChange={f('personName')} placeholder="Max Mustermann" />
        </FormField>
        <FormField label="E-Mail">
          <Input type="email" value={form.email} onChange={f('email')} placeholder="info@firma.de" />
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
          <Input value={form.paymentTerms} onChange={f('paymentTerms')} />
        </FormField>
        <FormField label="PDF-Fußzeile" className="sm:col-span-2">
          <textarea
            value={form.pdfFooter}
            onChange={(e) => setForm((f) => f ? { ...f, pdfFooter: e.target.value } : f)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
          />
        </FormField>
      </div>

      {/* Unterschrift */}
      <div className="border-t border-slate-100 pt-4">
        <h3 className="font-medium text-slate-800 mb-3">Unterschrift</h3>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {form.signature ? (
              <div className="relative w-48 h-20 border border-slate-200 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <img src={form.signature} alt="Unterschrift" className="max-w-full max-h-full object-contain p-1" />
                <button
                  onClick={() => setForm((f) => f ? { ...f, signature: null } : f)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('sig-upload')?.click()}
                className="w-48 h-20 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-400">Unterschrift hochladen</span>
              </div>
            )}
            <input
              id="sig-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setForm((f) => f ? { ...f, signature: ev.target?.result as string } : f);
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </div>
          <div className="text-xs text-slate-400 pt-2">
            PNG oder JPG mit transparentem Hintergrund empfohlen.
          </div>
        </div>

        <p className="text-xs font-medium text-slate-600 mb-2">Unterschrift einfügen bei:</p>
        <div className="space-y-2">
          {([
            { key: 'signatureOnInvoice', label: 'Rechnungen' },
            { key: 'signatureOnDeliveryNote', label: 'Lieferscheine' },
            { key: 'signatureOnLetter', label: 'Schreiben' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={(e) => setForm((f) => f ? { ...f, [key]: e.target.checked } : f)}
                className="w-4 h-4 rounded accent-brand-600"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button fullWidth onClick={handleSave}>Speichern</Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm whitespace-nowrap">
            <CheckCircle className="w-4 h-4" /> Gespeichert
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Artikel Tab ──────────────────────────────────────────────────────────────

function ArticleTab() {
  const navigate = useNavigate();
  const { articles, loggedInProfileId } = useStore();
  const count = articles.filter(
    (a) => a.profileId === null || a.profileId === loggedInProfileId
  ).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800">Artikelbibliothek</h2>
            <p className="text-sm text-slate-400 mt-0.5">{count} Artikel gespeichert</p>
          </div>
          <button
            onClick={() => navigate('/artikel')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Verwalten <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Artikel können beim Erstellen von Lieferscheinen direkt ausgewählt werden. Preis und MwSt. werden automatisch übernommen.
        </p>
      </div>
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
      const ok = importData(ev.target?.result as string);
      setImportMsg(ok ? 'Import erfolgreich!' : 'Fehler beim Import.');
      setTimeout(() => setImportMsg(''), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-1">Daten exportieren</h2>
        <p className="text-sm text-slate-400 mb-4">Alle Daten als JSON-Backup speichern.</p>
        <Button icon={<Download className="w-4 h-4" />} onClick={handleExport}>Backup exportieren</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-1">Daten importieren</h2>
        <p className="text-sm text-slate-400 mb-4">Backup wiederherstellen. Achtung: überschreibt alle aktuellen Daten.</p>
        <Button variant="outline" icon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
          Backup importieren
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        {importMsg && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${importMsg.includes('Fehler') ? 'text-red-500' : 'text-green-600'}`}>
            {importMsg.includes('Fehler') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {importMsg}
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
        <div className="flex gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Alle Daten werden sicher in der Cloud gespeichert und sind von jedem Gerät aus zugänglich.
          </p>
        </div>
      </div>
    </div>
  );
}
