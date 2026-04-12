import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Auth() {
  const { login } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(pin);
      if (!ok) {
        setError('Falscher PIN. Standard-PIN: 1234');
        setPin('');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Jorge Faktura</h1>
          <p className="text-brand-200 text-sm">Professionelles Rechnungsprogramm</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-5">Anmelden</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                PIN eingeben
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="••••"
                maxLength={10}
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
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Standard-PIN: 1234 — änderbar in Einstellungen
          </p>
        </form>
      </div>
    </div>
  );
}
