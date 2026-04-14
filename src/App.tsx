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

function AppRoutes() {
  const { supabaseUserId, loggedInProfileId, restoreSession } = useStore();
  const [sessionChecked, setSessionChecked] = useState(false);

  // On every page load: check if Supabase has a valid session and re-hydrate
  useEffect(() => {
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

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
