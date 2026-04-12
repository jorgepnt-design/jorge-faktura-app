import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewInvoiceModal({ isOpen, onClose }: NewInvoiceModalProps) {
  const navigate = useNavigate();

  const handleNewCustomer = () => {
    onClose();
    navigate('/kunden?new=1&redirect=rechnung');
  };

  const handleExistingCustomer = () => {
    onClose();
    navigate('/rechnungen?new=1');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neue Rechnung erstellen" size="sm">
      <div className="space-y-3">
        <button
          onClick={handleExistingCustomer}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-200 bg-brand-50 hover:bg-brand-100 hover:border-brand-300 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-200 transition-colors">
            <Users className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Bestehender Kunde</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Wählen Sie einen Kunden aus Ihrer Liste
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-400 flex-shrink-0" />
        </button>

        <button
          onClick={handleNewCustomer}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
            <UserPlus className="w-6 h-6 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Neuer Kunde</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Legen Sie zuerst einen neuen Kunden an
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
        </button>
      </div>
    </Modal>
  );
}
