import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Truck, PenLine, Euro, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatCard } from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../utils/helpers';
import NewInvoiceModal from '../components/invoice/NewInvoiceModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeProfileId, customers, invoices, deliveryNotes, letters } = useStore();
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const profileInvoices = invoices.filter((i) => i.profileId === activeProfileId);
  const profileCustomers = customers.filter((c) => c.profileId === activeProfileId);
  const profileDeliveryNotes = deliveryNotes.filter((n) => n.profileId === activeProfileId);
  const profileLetters = letters.filter((l) => l.profileId === activeProfileId);

  const totalRevenue = profileInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.netTotal, 0);

  const openRevenue = profileInvoices
    .filter((i) => i.status === 'open')
    .reduce((sum, i) => sum + i.grossTotal, 0);

  const recentInvoices = [...profileInvoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Übersicht Ihrer Aktivitäten</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewInvoice(true)}
          className="shadow-md shadow-brand-200"
        >
          <span className="hidden sm:inline">Neue Rechnung</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        <StatCard
          label="Rechnungen"
          value={profileInvoices.length}
          icon={<FileText className="w-5 h-5" />}
          color="text-brand-600 bg-brand-50"
          onClick={() => navigate('/rechnungen')}
        />
        <StatCard
          label="Kunden"
          value={profileCustomers.length}
          icon={<Users className="w-5 h-5" />}
          color="text-purple-600 bg-purple-50"
          onClick={() => navigate('/kunden')}
        />
        <StatCard
          label="Lieferscheine"
          value={profileDeliveryNotes.length}
          icon={<Truck className="w-5 h-5" />}
          color="text-amber-600 bg-amber-50"
          onClick={() => navigate('/lieferscheine')}
        />
        <StatCard
          label="Schreiben"
          value={profileLetters.length}
          icon={<PenLine className="w-5 h-5" />}
          color="text-emerald-600 bg-emerald-50"
          onClick={() => navigate('/schreiben')}
        />
        <StatCard
          label="Umsatz (Netto)"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-600 bg-green-50"
        />
        <StatCard
          label="Offen (Brutto)"
          value={formatCurrency(openRevenue)}
          icon={<Euro className="w-5 h-5" />}
          color="text-orange-600 bg-orange-50"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-left"
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Neue Rechnung</span>
          </button>
          <button
            onClick={() => navigate('/kunden')}
            className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-left"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Neuer Kunde</span>
          </button>
          <button
            onClick={() => navigate('/lieferscheine')}
            className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-left"
          >
            <Truck className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Lieferschein</span>
          </button>
          <button
            onClick={() => navigate('/schreiben')}
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-left"
          >
            <PenLine className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Neues Schreiben</span>
          </button>
        </div>
      </div>

      {/* Recent invoices */}
      {recentInvoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Letzte Rechnungen
            </h2>
            <button
              onClick={() => navigate('/rechnungen')}
              className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700"
            >
              Alle anzeigen <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => navigate('/rechnungen')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{inv.invoiceNumber}</p>
                  <p className="text-xs text-slate-400 truncate">{formatDate(inv.invoiceDate)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(inv.grossTotal)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(inv.status)}`}>
                    {getStatusLabel(inv.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NewInvoiceModal isOpen={showNewInvoice} onClose={() => setShowNewInvoice(false)} />
    </div>
  );
}
