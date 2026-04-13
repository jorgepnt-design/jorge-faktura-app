import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import {
  LayoutDashboard, Users, FileText, Truck, PenLine, LayoutTemplate, Settings, LogOut
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/kunden': 'Kunden',
  '/rechnungen': 'Rechnungen',
  '/lieferscheine': 'Lieferscheine',
  '/schreiben': 'Schreiben',
  '/vorlagen': 'Vorlagen',
  '/einstellungen': 'Einstellungen',
};

const desktopNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kunden', label: 'Kunden', icon: Users },
  { to: '/rechnungen', label: 'Rechnungen', icon: FileText },
  { to: '/lieferscheine', label: 'Lieferscheine', icon: Truck },
  { to: '/schreiben', label: 'Schreiben', icon: PenLine },
  { to: '/vorlagen', label: 'Vorlagen', icon: LayoutTemplate },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useStore();
  const location = useLocation();

  const pageTitle = Object.entries(routeTitles).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'Jorge Faktura';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 fixed top-0 left-0 bottom-0 z-30">
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Jorge Faktura</span>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {desktopNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Header title={pageTitle} onMenuOpen={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
