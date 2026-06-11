import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, PenLine, Menu } from 'lucide-react';

// 4 Kernziele + "Mehr". Alles Weitere (Lieferscheine, Artikel, Vorlagen,
// Prompts, Einstellungen) liegt im Drawer hinter "Mehr" – keine horizontal
// scrollende Leiste mehr, jedes Ziel ist mit dem Daumen erreichbar.
const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rechnungen', label: 'Rechnungen', icon: FileText },
  { to: '/kunden', label: 'Kunden', icon: Users },
  { to: '/schreiben', label: 'Schreiben', icon: PenLine },
];

// Routen, die nicht in der Leiste liegen → "Mehr" wird als aktiv markiert
const moreRoutes = ['/lieferscheine', '/artikel', '/vorlagen', '/prompt-generator', '/einstellungen'];

interface BottomNavProps {
  onMore: () => void;
}

export default function BottomNav({ onMore }: BottomNavProps) {
  const location = useLocation();
  const moreActive = moreRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-bottom md:hidden">
      <div className="grid grid-cols-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 min-h-[52px] transition-colors ${
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                    isActive ? 'bg-brand-50 dark:bg-brand-900/40' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 2} />
                </span>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={onMore}
          className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 min-h-[52px] transition-colors ${
            moreActive
              ? 'text-brand-700 dark:text-brand-300'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          aria-label="Weitere Bereiche öffnen"
        >
          <span
            className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
              moreActive ? 'bg-brand-50 dark:bg-brand-900/40' : ''
            }`}
          >
            <Menu className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-medium leading-none">Mehr</span>
        </button>
      </div>
    </nav>
  );
}
