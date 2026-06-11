import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Farbton der Zeile – danger steht für destruktive Aktionen */
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  /** Trennlinie oberhalb dieser Zeile */
  dividerBefore?: boolean;
}

const toneClasses: Record<NonNullable<ActionMenuItem['tone']>, string> = {
  default: 'text-slate-700 hover:bg-slate-50',
  brand: 'text-brand-600 hover:bg-brand-50',
  success: 'text-green-600 hover:bg-green-50',
  warning: 'text-amber-600 hover:bg-amber-50',
  danger: 'text-red-500 hover:bg-red-50',
};

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Tailwind-Breitenklasse des Dropdowns */
  widthClass?: string;
  ariaLabel?: string;
}

/** Drei-Punkte-Menü für Listenkarten (Rechnungen, Kunden, Schreiben, ...). */
export default function ActionMenu({ items, widthClass = 'w-44', ariaLabel = 'Aktionen' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div role="menu" className={`absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 ${widthClass}`}>
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.dividerBefore && <div className="my-1 border-t border-slate-100" />}
                <button
                  role="menuitem"
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${toneClasses[item.tone ?? 'default']}`}
                >
                  {item.icon} {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
