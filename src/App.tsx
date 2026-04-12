import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import DeliveryNotes from './pages/DeliveryNotes';
import Letters from './pages/Letters';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

function AppRoutes() {
  const { isAuthenticated, profiles, addProfile, activeProfileId } = useStore();

  // Ensure at least one profile exists after hydration
  useEffect(() => {
    if (isAuthenticated && profiles.length === 0) {
      addProfile({
        internalName: 'Mein Profil',
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
  }, [isAuthenticated, profiles.length]);

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="kunden" element={<Customers />} />
        <Route path="rechnungen" element={<Invoices />} />
        <Route path="lieferscheine" element={<DeliveryNotes />} />
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
    <BrowserRouter basename="/jorge-faktura-app">
      <AppRoutes />
    </BrowserRouter>
  );
}
