import React, { useState } from 'react';
import { Download, Mail, MessageCircle, X, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  filename: string;
  subject: string;
  bodyText: string;
  recipientEmail?: string;
  onEmailChange?: (email: string) => void;
}

export default function ShareModal({
  isOpen, onClose, blobUrl, filename, subject, bodyText,
  recipientEmail = '', onEmailChange,
}: ShareModalProps) {
  const [sharing, setSharing] = useState(false);

  if (!isOpen || !blobUrl) return null;

  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  /** Fetch the blob from the object URL and create a File for Web Share API */
  const getFile = async (): Promise<File> => {
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    return new File([blob], filename, { type: 'application/pdf' });
  };

  /** Native share sheet — attaches the PDF directly on mobile */
  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const file = await getFile();
      await navigator.share({ files: [file], title: subject, text: bodyText });
    } catch {
      // user cancelled or not supported
    } finally {
      setSharing(false);
    }
  };

  /** Download PDF first, then open mail client */
  const handleEmail = async () => {
    downloadFile();
    await new Promise((r) => setTimeout(r, 400));
    const sub = encodeURIComponent(subject);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${recipientEmail}?subject=${sub}&body=${body}`;
  };

  /** Download PDF first, then open WhatsApp */
  const handleWhatsApp = async () => {
    downloadFile();
    await new Promise((r) => setTimeout(r, 400));
    const msg = encodeURIComponent(`${subject}\n\n${bodyText}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

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

        <div className="space-y-3">
          {/* Download */}
          <button
            onClick={downloadFile}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>PDF herunterladen</span>
          </button>

          {/* Native share (mobile) — attaches the file directly */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-5 h-5 text-brand-500" />
              <span>{sharing ? 'Wird geteilt…' : 'Teilen (mit Anhang)'}</span>
            </button>
          )}

          {/* Email */}
          <div className="space-y-2">
            {onEmailChange && (
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="Empfänger E-Mail (optional)"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            )}
            <button
              onClick={handleEmail}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Per E-Mail senden</span>
            </button>
          </div>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span>Per WhatsApp teilen</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          {canNativeShare
            ? 'Mit „Teilen" wird die PDF direkt als Anhang geöffnet.'
            : 'PDF wird automatisch heruntergeladen — dann in der App anhängen.'}
        </p>
      </div>
    </div>
  );
}
