import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Building2, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SearchInput from '../components/common/SearchInput';
import ActionMenu from '../components/common/ActionMenu';
import { toast } from '../components/common/Toast';
import { FormField, Input, Textarea, Select } from '../components/common/FormField';
import { Customer } from '../types';

interface CustomerFormData {
  profileId: string;
  customerNumber: string;
  companyName: string;
  contactPerson: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  mobile: string;
  notes: string;
}

const emptyForm: CustomerFormData = {
  profileId: '',
  customerNumber: '',
  companyName: '',
  contactPerson: '',
  address: '',
  zipCode: '',
  city: '',
  country: 'Deutschland',
  email: '',
  phone: '',
  mobile: '',
  notes: '',
};

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profiles, loggedInProfileId, customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormData>({ ...emptyForm, profileId: loggedInProfileId || '' });
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});

  // Kommt der Nutzer über "Neue Rechnung → Neuer Kunde", öffnet sich das
  // Formular sofort; nach dem Speichern geht es direkt zur Rechnung weiter.
  const redirectToInvoice = searchParams.get('redirect') === 'rechnung';
  useEffect(() => {
    if (searchParams.get('new') === '1') handleOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      // Nur Kunden des eingeloggten Profils
      if (c.profileId !== loggedInProfileId) return false;
      const q = search.toLowerCase();
      return (
        !search ||
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [customers, search, loggedInProfileId]);

  const handleOpen = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setForm({
        profileId: customer.profileId,
        customerNumber: customer.customerNumber || '',
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        address: customer.address,
        zipCode: customer.zipCode,
        city: customer.city,
        country: customer.country,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        notes: customer.notes,
      });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, profileId: loggedInProfileId || '' });
    }
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const errs: Partial<CustomerFormData> = {};
    if (!form.profileId) errs.profileId = 'Bitte Profil wählen';
    if (!form.companyName.trim()) errs.companyName = 'Firmenname ist erforderlich';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) {
      updateCustomer(editingId, form);
      toast.success('Kunde gespeichert');
      setShowForm(false);
      return;
    }
    const customer = addCustomer(form);
    setShowForm(false);
    if (redirectToInvoice) {
      // Weiter zur Rechnung – der neue Kunde ist dort schon vorausgewählt
      navigate(`/rechnungen?new=1&customer=${customer.id}`, { replace: true });
    } else {
      toast.success('Kunde angelegt');
    }
  };

  const profileName = (id: string) =>
    profiles.find((p) => p.id === id)?.internalName || '-';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kunden</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} Kunden</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => handleOpen()}>
          Neuer Kunde
        </Button>
      </div>

      {/* Suche */}
      <SearchInput value={search} onChange={setSearch} placeholder="Kunden suchen..." />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="Noch keine Kunden"
          description="Legen Sie Ihren ersten Kunden an, um loszulegen."
          action={{ label: '+ Neuer Kunde', onClick: () => handleOpen() }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              profileName={profileName(customer.profileId)}
              onEdit={() => handleOpen(customer)}
              onDelete={() => setDeleteId(customer.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button fullWidth onClick={handleSave}>
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Profil" required error={errors.profileId}>
            <Select
              value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })}
              error={!!errors.profileId}
            >
              <option value="">Profil wählen...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.internalName}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Firmenname" required error={errors.companyName} className="sm:col-span-2">
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Muster GmbH"
                error={!!errors.companyName}
              />
            </FormField>

            <FormField label="Kundennummer">
              <Input
                value={form.customerNumber}
                onChange={(e) => setForm({ ...form, customerNumber: e.target.value })}
                placeholder="z.B. KD-001"
              />
            </FormField>

            <FormField label="Ansprechpartner">
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Max Mustermann"
              />
            </FormField>

            <FormField label="E-Mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@muster.de"
              />
            </FormField>

            <FormField label="Adresse" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Musterstraße 1"
              />
            </FormField>

            <FormField label="PLZ">
              <Input
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                placeholder="12345"
                maxLength={10}
              />
            </FormField>

            <FormField label="Stadt">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Berlin"
              />
            </FormField>

            <FormField label="Land">
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Deutschland"
              />
            </FormField>

            <FormField label="Telefon">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+49 30 123456"
              />
            </FormField>

            <FormField label="Mobilfunknummer">
              <Input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+49 151 123456"
              />
            </FormField>

            <FormField label="Notizen" className="sm:col-span-2">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Interne Notizen..."
                rows={3}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteCustomer(deleteId); toast.success('Kunde gelöscht'); } }}
        title="Kunde löschen"
        message="Möchten Sie diesen Kunden wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  profileName: string;
  onEdit: () => void;
  onDelete: () => void;
}

function CustomerCard({ customer, profileName, onEdit, onDelete }: CustomerCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{customer.companyName}</p>
              {customer.contactPerson && (
                <p className="text-sm text-slate-500 truncate">{customer.contactPerson}</p>
              )}
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
              {profileName}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {customer.email && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Mail className="w-3 h-3" /> {customer.email}
              </span>
            )}
            {customer.city && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3" /> {customer.city}
              </span>
            )}
            {(customer.phone || customer.mobile) && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3 h-3" /> {customer.phone || customer.mobile}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <ActionMenu
            widthClass="w-36"
            items={[
              { label: 'Bearbeiten', icon: <Edit2 className="w-4 h-4" />, onClick: onEdit },
              { label: 'Löschen', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
