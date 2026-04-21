import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import ProfileSelect from './pages/ProfileSelect';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import DeliveryNotes from './pages/DeliveryNotes';
import Articles from './pages/Articles';
import Letters from './pages/Letters';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import { isSupabaseConfigured } from './lib/supabase';

function AppRoutes() {
  const { supabaseUserId, loggedInProfileId, restoreSession } = useStore();
  const [sessionChecked, setSessionChecked] = useState(false);

  // On every page load: check if Supabase has a valid session and re-hydrate
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionChecked(true);
      return;
    }
    restoreSession().finally(() => setSessionChecked(true));
  }, []);

  // Show full-screen spinner while we check the session (prevents auth-flash)
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return <MissingSupabaseConfig />;
  }

  // Not authenticated → login screen
  if (!supabaseUserId) {
    return <Auth />;
  }

  // Authenticated but no profile chosen → profile picker
  if (!loggedInProfileId) {
    return <ProfileSelect />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="kunden" element={<Customers />} />
        <Route path="rechnungen" element={<Invoices />} />
        <Route path="lieferscheine" element={<DeliveryNotes />} />
        <Route path="artikel" element={<Articles />} />
        <Route path="schreiben" element={<Letters />} />
        <Route path="vorlagen" element={<Templates />} />
        <Route path="einstellungen" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function MissingSupabaseConfig() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <img src="/logo.png" alt="Jorge Faktura" className="w-16 h-16 rounded-2xl mb-5" />
        <h1 className="text-xl font-bold text-slate-900">Supabase-Konfiguration fehlt</h1>
        <p className="mt-2 text-sm text-slate-600">
          Die App läuft lokal, aber ihr fehlen die Zugangsdaten für Supabase. Lege eine Datei
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>
          im Projektordner an und fülle diese Werte aus:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
        </pre>
        <p className="mt-4 text-sm text-slate-500">
          Danach den lokalen Dev-Server neu starten. Auf Vercel sind diese Werte normalerweise schon als Environment
          Variables im Projekt hinterlegt.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
