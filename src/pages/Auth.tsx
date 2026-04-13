import React, { useState } from 'react';
import { ChevronLeft, UserPlus, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

type Step = 'login' | 'register' | 'forgot';

export default function Auth() {
  const { loginWithEmail, registerWithEmail, resetPassword, isLoading } = useStore();
  const [step, setStep] = useState<Step>('login');

  // ── Login state ────────────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [pin, setPin]           = useState('');
  const [showPin, setShowPin]   = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── Register state ─────────────────────────────────────────────────────────
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPin, setRegPin]             = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [showRegPin, setShowRegPin]     = useState(false);
  const [regError, setRegError]         = useState('');

  // ── Forgot state ───────────────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotError, setForgotError]   = useState('');
  const [forgotSent, setForgotSent]     = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const ok = await loginWithEmail(email.trim(), pin);
    if (!ok) {
      setLoginError('E-Mail oder PIN falsch. Bitte erneut versuchen.');
      setPin('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim())            { setRegError('Bitte einen Benutzernamen eingeben.'); return; }
    if (!regEmail.trim())           { setRegError('Bitte eine E-Mail-Adresse eingeben.'); return; }
    if (regPin.length < 6)          { setRegError('PIN muss mindestens 6 Zeichen haben.'); return; }
    if (regPin !== regPinConfirm)   { setRegError('Die PINs stimmen nicht überein.'); return; }

    const result = await registerWithEmail(regEmail.trim(), regPin, regName.trim());
    if (!result.success) setRegError(result.error || 'Registrierung fehlgeschlagen.');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Bitte eine E-Mail-Adresse eingeben.'); return; }
    setForgotLoading(true);
    const result = await resetPassword(forgotEmail.trim());
    setForgotLoading(false);
    if (!result.success) {
      setForgotError(result.error || 'Fehler beim Senden der E-Mail.');
    } else {
      setForgotSent(true);
    }
  };

  const goToRegister = () => {
    setRegName(''); setRegEmail(''); setRegPin(''); setRegPinConfirm('');
    setRegError(''); setShowRegPin(false);
    setStep('register');
  };

  const goToForgot = () => {
    setForgotEmail(email); setForgotError(''); setForgotSent(false);
    setStep('forgot');
  };

  const goBack = () => {
    setStep('login');
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Jorge Faktura" className="w-24 h-24 mx-auto mb-4 drop-shadow-xl" />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ── Login ────────────────────────────────────────────────────────── */}
          {step === 'login' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Willkommen</h2>
              <p className="text-sm text-slate-400 mb-5">Melden Sie sich mit Ihrer E-Mail an.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                    placeholder="ihre@email.de"
                    autoComplete="email"
                    autoFocus
                    className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">PIN</label>
                    <button
                      type="button"
                      onClick={goToForgot}
                      className="text-xs text-brand-500 hover:text-brand-700 transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => { setPin(e.target.value); setLoginError(''); }}
                      placeholder="••••••"
                      maxLength={20}
                      className={`w-full h-11 px-4 pr-11 rounded-xl border text-center text-xl font-bold tracking-widest
                        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                        ${loginError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginError && <p className="text-xs text-red-500 mt-1.5">{loginError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={!email || !pin || isLoading}
                  className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold text-base
                    hover:bg-brand-700 active:bg-brand-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : 'Anmelden'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={goToRegister}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl
                    border-2 border-dashed border-brand-200 text-brand-600 font-medium text-sm
                    hover:bg-brand-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Neues Konto erstellen
                </button>
              </div>
            </div>
          )}

          {/* ── Passwort vergessen ────────────────────────────────────────────── */}
          {step === 'forgot' && (
            <div className="p-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Passwort zurücksetzen</h2>
                  <p className="text-xs text-slate-400">Link per E-Mail erhalten</p>
                </div>
              </div>

              {forgotSent ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">E-Mail gesendet!</p>
                  <p className="text-sm text-slate-500 mb-5">
                    Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Link zum Zurücksetzen des Passworts.
                  </p>
                  <button onClick={goBack} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                    Zurück zur Anmeldung
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Registrierte E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                      placeholder="ihre@email.de"
                      autoFocus
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>

                  {forgotError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      {forgotError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!forgotEmail.trim() || forgotLoading}
                    className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold text-base
                      hover:bg-brand-700 active:bg-brand-800 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      : 'Reset-Link senden'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Register ─────────────────────────────────────────────────────── */}
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
                  <p className="text-xs text-slate-400">Name, E-Mail und PIN festlegen</p>
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
                    E-Mail <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setRegError(''); }}
                    placeholder="ihre@email.de"
                    className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    PIN wählen <span className="text-red-400">*</span>
                    <span className="text-slate-400 font-normal ml-1">(mind. 6 Zeichen)</span>
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
                  disabled={!regName.trim() || !regEmail.trim() || !regPin || !regPinConfirm || isLoading}
                  className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold text-base
                    hover:bg-brand-700 active:bg-brand-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : 'Konto erstellen & anmelden'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          Daten werden sicher in der Cloud gespeichert.
        </p>
      </div>
    </div>
  );
}
