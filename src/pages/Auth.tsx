import React, { useState } from 'react';
import { FileText, ChevronLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Profile } from '../types';

type Step = 'select' | 'pin' | 'register';

export default function Auth() {
  const { profiles, loginWithProfile, addProfile } = useStore();
  const [step, setStep] = useState<Step>('select');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Login state
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regError, setRegError] = useState('');

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin('');
    setLoginError('');
    setStep('pin');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setLoading(true);
    setTimeout(() => {
      const ok = loginWithProfile(selectedProfile.id, pin);
      if (!ok) {
        setLoginError('Falscher PIN. Bitte erneut versuchen.');
        setPin('');
      }
      setLoading(false);
    }, 300);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim()) { setRegError('Bitte einen Benutzernamen eingeben.'); return; }
    if (regPin.length < 4) { setRegError('PIN muss mindestens 4 Zeichen haben.'); return; }
    if (regPin !== regPinConfirm) { setRegError('Die PINs stimmen nicht überein.'); return; }
    if (profiles.some((p) => p.internalName.toLowerCase() === regName.trim().toLowerCase())) {
      setRegError('Dieser Benutzername ist bereits vergeben.');
      return;
    }

    const newProfile = addProfile({
      internalName: regName.trim(),
      pin: regPin,
      companyName: '', personName: '', address: '', zipCode: '',
      city: '', country: 'Deutschland', email: '', phone: '',
      mobile: '', website: '', taxNumber: '', vatId: '',
      bankName: '', iban: '', bic: '',
      paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
      logo: null, pdfFooter: '',
    });

    loginWithProfile(newProfile.id, regPin);
  };

  const goToRegister = () => {
    setRegName(''); setRegPin(''); setRegPinConfirm('');
    setRegError(''); setShowRegPin(false);
    setStep('register');
  };

  const goBack = () => {
    setStep('select');
    setLoginError(''); setPin('');
    setRegError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Jorge Faktura</h1>
          <p className="text-brand-200 text-sm">Professionelles Rechnungsprogramm</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ── Step: Profil wählen ───────────────────────────────────────── */}
          {step === 'select' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Willkommen</h2>
              <p className="text-sm text-slate-400 mb-5">
                {profiles.length > 0 ? 'Mit welchem Profil möchten Sie sich anmelden?' : 'Legen Sie zuerst ein Konto an.'}
              </p>

              {profiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectProfile(profile)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all text-left group"
                    >
                      {profile.logo ? (
                        <img
                          src={profile.logo}
                          alt={profile.internalName}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {profile.internalName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{profile.internalName}</p>
                        {profile.companyName && (
                          <p className="text-xs text-slate-400 truncate">{profile.companyName}</p>
                        )}
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-brand-400 rotate-180 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Register button */}
              <div className={profiles.length > 0 ? 'border-t border-slate-100 pt-4' : ''}>
                <button
                  onClick={goToRegister}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-brand-200 text-brand-600 font-medium text-sm hover:bg-brand-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Neues Konto erstellen
                </button>
              </div>
            </div>
          )}

          {/* ── Step: PIN eingeben ────────────────────────────────────────── */}
          {step === 'pin' && selectedProfile && (
            <div className="p-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>

              <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-2xl">
                {selectedProfile.logo ? (
                  <img src={selectedProfile.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                    {selectedProfile.internalName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{selectedProfile.internalName}</p>
                  {selectedProfile.companyName && (
                    <p className="text-xs text-slate-400">{selectedProfile.companyName}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN eingeben</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setLoginError(''); }}
                    placeholder="••••"
                    maxLength={20}
                    autoFocus
                    className={`w-full h-12 px-4 rounded-xl border text-center text-2xl font-bold tracking-widest
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                      ${loginError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {loginError && <p className="text-xs text-red-500 mt-1.5">{loginError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={!pin || loading}
                  className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold text-base
                    hover:bg-brand-700 active:bg-brand-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : 'Anmelden'}
                </button>
              </form>
            </div>
          )}

          {/* ── Step: Registrieren ────────────────────────────────────────── */}
          {step === 'register' && (
            <div className="p-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Neues Konto erstellen</h2>
                  <p className="text-xs text-slate-400">Benutzername und PIN festlegen</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Benutzername <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => { setRegName(e.target.value); setRegError(''); }}
                    placeholder="z.B. Max Mustermann"
                    maxLength={50}
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    PIN wählen <span className="text-red-400">*</span>
                    <span className="text-slate-400 font-normal ml-1">(mind. 4 Zeichen)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPin ? 'text' : 'password'}
                      value={regPin}
                      onChange={(e) => { setRegPin(e.target.value); setRegError(''); }}
                      placeholder="PIN eingeben"
                      maxLength={20}
                      className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-300 text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPin(!showRegPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    PIN wiederholen <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPinConfirm}
                    onChange={(e) => { setRegPinConfirm(e.target.value); setRegError(''); }}
                    placeholder="PIN bestätigen"
                    maxLength={20}
                    className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {regError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {regError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!regName.trim() || !regPin || !regPinConfirm}
                  className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold text-base
                    hover:bg-brand-700 active:bg-brand-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Konto erstellen & anmelden
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          Daten werden sicher lokal gespeichert.
        </p>
      </div>
    </div>
  );
}
