import React from 'react';
import { Download, Mail, MessageCircle, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  filename: string;
  subject: string;
  bodyText: string;
  recipientEmail?: string;
}

export default function ShareModal({
  isOpen, onClose, blobUrl, filename, subject, bodyText, recipientEmail = '',
}: ShareModalProps) {
  if (!isOpen || !blobUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const handleEmail = () => {
    const body = encodeURIComponent(bodyText);
    const sub = encodeURIComponent(subject);
    window.location.href = `mailto:${recipientEmail}?subject=${sub}&body=${body}`;
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${subject}\n\n${bodyText}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">Teilen</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Laden Sie das Dokument zuerst herunter, um es dann zu teilen.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>PDF herunterladen</span>
          </button>

          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-500" />
            <span>Per E-Mail senden</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span>Per WhatsApp teilen</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          PDF herunterladen, dann in WhatsApp/E-Mail anhängen
        </p>
      </div>
    </div>
  );
}
