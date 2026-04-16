import React from 'react';
import { X, Download } from 'lucide-react';

interface Props {
  blobUrl: string | null;
  title: string;
  onClose: () => void;
  onDownload: () => void;
}

export default function PDFPreviewModal({ blobUrl, title, onClose, onDownload }: Props) {
  if (!blobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <h2 className="font-semibold text-slate-800 truncate mr-4">{title}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Herunterladen</span>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-100 p-2 md:p-4">
        <iframe
          src={blobUrl}
          className="w-full h-full rounded-lg shadow-lg bg-white"
          title={title}
        />
      </div>
    </div>
  );
}
