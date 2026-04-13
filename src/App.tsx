import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import DeliveryNotes from './pages/DeliveryNotes';
import Articles from './pages/Articles';
import Letters from './pages/Letters';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

function AppRoutes() {
  const { loggedInProfileId, profiles, addProfile } = useStore();

  // Ensure at least one profile exists
  useEffect(() => {
    if (profiles.length === 0) {
      addProfile({
        internalName: 'Admin',
        pin: '1234',
        companyName: '',
        personName: '',
        address: '',
        zipCode: '',
        city: '',
        country: 'Deutschland',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        taxNumber: '',
        vatId: '',
        bankName: '',
        iban: '',
        bic: '',
        paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
        logo: null,
        pdfFooter: '',
      });
    }
  }, [profiles.length]);

  if (!loggedInProfileId) {
    return <Auth />;
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
