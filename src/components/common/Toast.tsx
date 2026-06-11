import React, { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, type: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type) =>
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id: nextId++, message, type }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Kurze Bestätigung einblenden – von überall aufrufbar, kein Provider nötig. */
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};

const toneClasses: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white dark:bg-slate-700',
};

const toneIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
  error: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
  info: <Info className="w-4 h-4 flex-shrink-0" />,
};

function ToastEntry({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, dismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg animate-slide-up ${toneClasses[item.type]}`}
    >
      {toneIcons[item.type]}
      <span className="text-sm font-medium">{item.message}</span>
      <button
        onClick={() => dismiss(item.id)}
        className="ml-1 -mr-1 p-1 rounded-lg opacity-70 hover:opacity-100"
        aria-label="Hinweis schließen"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Einmal im Layout rendern. Mobil über der Bottom-Nav, Desktop unten rechts. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 md:inset-x-auto md:right-6 md:bottom-6 z-[80] flex flex-col items-center md:items-end gap-2 px-4">
      {toasts.map((t) => (
        <ToastEntry key={t.id} item={t} />
      ))}
    </div>
  );
}
