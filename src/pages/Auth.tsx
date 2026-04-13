import React, { useState } from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Profile } from '../types';

type Step = 'select' | 'pin';

export default function Auth() {
  const { profiles, loginWithProfile } = useStore();
  const [step, setStep] = useState<Step>('select');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
    setStep('pin');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setLoading(true);
    setTimeout(() => {
      const ok = loginWithProfile(selectedProfile.id, pin);
      if (!ok) {
        setError('Falscher PIN. Bitte erneut versuchen.');
        setPin('');
      }
      setLoading(false);
    }, 300);
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
          {/* Step: Profil wählen */}
          {step === 'select' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Profil wählen</h2>
              <p className="text-sm text-slate-400 mb-5">Mit welchem Profil möchten Sie sich anmelden?</p>

              {profiles.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Keine Profile vorhanden.
                </p>
              ) : (
                <div className="space-y-2">
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
            </div>
          )}

          {/* Step: PIN eingeben */}
          {step === 'pin' && selectedProfile && (
            <div className="p-6">
              <button
                onClick={() => { setStep('select'); setError(''); setPin(''); }}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>

              {/* Aktives Profil anzeigen */}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    PIN eingeben
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    placeholder="••••"
                    maxLength={20}
                    autoFocus
                    className={`w-full h-12 px-4 rounded-xl border text-center text-2xl font-bold tracking-widest
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                      ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
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
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
