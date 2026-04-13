import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  Package,
  PenLine,
  LayoutTemplate,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kunden', label: 'Kunden', icon: Users },
  { to: '/rechnungen', label: 'Rechnungen', icon: FileText },
  { to: '/lieferscheine', label: 'Lieferschein', icon: Truck },
  { to: '/artikel', label: 'Artikel', icon: Package },
  { to: '/schreiben', label: 'Schreiben', icon: PenLine },
  { to: '/vorlagen', label: 'Vorlagen', icon: LayoutTemplate },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-bottom md:hidden">
      <div className="flex items-stretch overflow-x-auto scrollbar-none">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-[52px] flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                isActive
                  ? 'text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${
                    isActive ? 'bg-brand-50' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight text-center whitespace-nowrap">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
