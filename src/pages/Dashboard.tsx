import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  PenLine,
  Plus,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../utils/helpers';
import NewInvoiceModal from '../components/invoice/NewInvoiceModal';
import { Invoice } from '../types';

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getInvoiceDate(invoice: Invoice) {
  return new Date(invoice.invoiceDate || invoice.createdAt);
}

function isOverdue(invoice: Invoice) {
  if (invoice.status !== 'open' || !invoice.dueDate) return false;
  const dueDate = new Date(`${invoice.dueDate}T23:59:59`);
  return dueDate < new Date();
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const dueDate = new Date(`${dateStr}T23:59:59`);
  const diff = dueDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { loggedInProfileId, customers, invoices, deliveryNotes, letters } = useStore();
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const metrics = useMemo(() => {
    const profileInvoices = invoices.filter((i) => i.profileId === loggedInProfileId);
    const profileCustomers = customers.filter((c) => c.profileId === loggedInProfileId);
    const profileDeliveryNotes = deliveryNotes.filter((n) => n.profileId === loggedInProfileId);
    const profileLetters = letters.filter((l) => l.profileId === loggedInProfileId);
    const currentMonth = getMonthKey(new Date());

    const paidInvoices = profileInvoices.filter((i) => i.status === 'paid');
    const openInvoices = profileInvoices.filter((i) => i.status === 'open');
    const overdueInvoices = openInvoices.filter(isOverdue);
    const draftInvoices = profileInvoices.filter((i) => i.status === 'draft');

    const paidRevenue = paidInvoices.reduce((sum, i) => sum + i.grossTotal, 0);
    const monthRevenue = paidInvoices
      .filter((i) => getMonthKey(getInvoiceDate(i)) === currentMonth)
      .reduce((sum, i) => sum + i.grossTotal, 0);
    const openRevenue = openInvoices.reduce((sum, i) => sum + i.grossTotal, 0);
    const overdueRevenue = overdueInvoices.reduce((sum, i) => sum + i.grossTotal, 0);
    const completionRate = profileInvoices.length
      ? Math.round((paidInvoices.length / profileInvoices.length) * 100)
      : 0;

    const upcomingInvoices = openInvoices
      .filter((i) => i.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);

    const recentPaidInvoices = paidInvoices
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);

    return {
      profileInvoices,
      profileCustomers,
      profileDeliveryNotes,
      profileLetters,
      paidRevenue,
      monthRevenue,
      openRevenue,
      overdueRevenue,
      overdueInvoices,
      draftInvoices,
      completionRate,
      upcomingInvoices,
      recentPaidInvoices,
    };
  }, [customers, deliveryNotes, invoices, letters, loggedInProfileId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Finanzen, Aufgaben und letzte Aktivitäten auf einen Blick</p>
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

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-100">Umsatz diesen Monat</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{formatCurrency(metrics.monthRevenue)}</p>
              <p className="mt-2 text-sm text-brand-100">
                Insgesamt bezahlt: {formatCurrency(metrics.paidRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-brand-100">Offen</p>
              <p className="mt-1 font-semibold">{formatCurrency(metrics.openRevenue)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-brand-100">Abschlussquote</p>
              <p className="mt-1 font-semibold">{metrics.completionRate}% bezahlt</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Überfällig</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.overdueRevenue)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {metrics.overdueInvoices.length === 0
              ? 'Keine überfälligen Rechnungen. Sehr ordentlich.'
              : `${metrics.overdueInvoices.length} Rechnung(en) brauchen Aufmerksamkeit.`}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Rechnungen"
          value={metrics.profileInvoices.length}
          icon={<FileText className="w-5 h-5" />}
          color="text-brand-600 bg-brand-50"
          onClick={() => navigate('/rechnungen')}
        />
        <MetricCard
          label="Kunden"
          value={metrics.profileCustomers.length}
          icon={<Users className="w-5 h-5" />}
          color="text-sky-600 bg-sky-50"
          onClick={() => navigate('/kunden')}
        />
        <MetricCard
          label="Entwürfe"
          value={metrics.draftInvoices.length}
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-600 bg-amber-50"
          onClick={() => navigate('/rechnungen')}
        />
        <MetricCard
          label="Dokumente"
          value={metrics.profileDeliveryNotes.length + metrics.profileLetters.length}
          icon={<PenLine className="w-5 h-5" />}
          color="text-emerald-600 bg-emerald-50"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardPanel
          title="Nächste Fälligkeiten"
          actionLabel="Rechnungen"
          onAction={() => navigate('/rechnungen')}
        >
          {metrics.upcomingInvoices.length === 0 ? (
            <EmptyPanel icon={<CheckCircle2 className="w-6 h-6" />} text="Keine offenen Fälligkeiten." />
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.upcomingInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  customerName={customers.find((c) => c.id === invoice.customerId)?.companyName || '-'}
                  meta={getDueLabel(invoice)}
                  urgent={isOverdue(invoice)}
                  onClick={() => navigate('/rechnungen')}
                />
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Zuletzt bezahlt"
          actionLabel="Alle anzeigen"
          onAction={() => navigate('/rechnungen')}
        >
          {metrics.recentPaidInvoices.length === 0 ? (
            <EmptyPanel icon={<Euro className="w-6 h-6" />} text="Noch keine bezahlten Rechnungen." />
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.recentPaidInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  customerName={customers.find((c) => c.id === invoice.customerId)?.companyName || '-'}
                  meta={`Bezahlt: ${formatDate(invoice.updatedAt)}`}
                  onClick={() => navigate('/rechnungen')}
                />
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction
            label="Neue Rechnung"
            icon={<FileText className="w-5 h-5" />}
            className="bg-brand-50 text-brand-700 hover:bg-brand-100"
            onClick={() => setShowNewInvoice(true)}
          />
          <QuickAction
            label="Neuer Kunde"
            icon={<Users className="w-5 h-5" />}
            className="bg-sky-50 text-sky-700 hover:bg-sky-100"
            onClick={() => navigate('/kunden')}
          />
          <QuickAction
            label="Lieferschein"
            icon={<Truck className="w-5 h-5" />}
            className="bg-amber-50 text-amber-700 hover:bg-amber-100"
            onClick={() => navigate('/lieferscheine')}
          />
          <QuickAction
            label="Schreiben"
            icon={<PenLine className="w-5 h-5" />}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => navigate('/schreiben')}
          />
        </div>
      </section>

      <NewInvoiceModal isOpen={showNewInvoice} onClose={() => setShowNewInvoice(false)} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm ${
        onClick ? 'hover:border-slate-200 hover:shadow-md active:scale-[0.99]' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <p className="mt-3 text-2xl font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </Tag>
  );
}

function DashboardPanel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between p-5 pb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        <button
          onClick={onAction}
          className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700"
        >
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      {children}
    </div>
  );
}

function InvoiceRow({
  invoice,
  customerName,
  meta,
  urgent,
  onClick,
}: {
  invoice: Invoice;
  customerName: string;
  meta: string;
  urgent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        urgent ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
      }`}
      >
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{invoice.invoiceNumber}</p>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(invoice.status)}`}>
            {getStatusLabel(invoice.status)}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate">{customerName} · {meta}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 flex-shrink-0">{formatCurrency(invoice.grossTotal)}</p>
    </button>
  );
}

function EmptyPanel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <div className="mx-auto mb-2 w-11 h-11 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  className,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${className}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function getDueLabel(invoice: Invoice) {
  const days = daysUntil(invoice.dueDate);
  if (days === null) return 'ohne Fälligkeit';
  if (days < 0) return `${Math.abs(days)} Tag(e) überfällig`;
  if (days === 0) return 'heute fällig';
  return `fällig in ${days} Tag(en)`;
}
