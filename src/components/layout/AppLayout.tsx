import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import {
  LayoutDashboard, Users, FileText, Truck, PenLine, LayoutTemplate, Settings, LogOut, ChevronDown,
  Sun, Moon
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useDarkMode } from '../../hooks/useDarkMode';

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { logout, getLoggedInProfile, profiles, switchProfile, loggedInProfileId } = useStore();
  const [dark, setDark] = useDarkMode();
  const profile = getLoggedInProfile();
  const location = useLocation();

  const pageTitle = Object.entries(routeTitles).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'Jorge Faktura';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 fixed top-0 left-0 bottom-0 z-30">
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Jorge Faktura</span>
          <button
            onClick={() => setDark(!dark)}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Dark mode umschalten"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
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
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        {/* Profile section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          {/* Current profile + switcher */}
          <div className="relative mb-1">
            <button
              onClick={() => setProfileMenuOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              {profile?.logo ? (
                <img src={profile.logo} alt="" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {(profile?.internalName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{profile?.internalName || '-'}</span>
              {profiles.length > 1 && <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </button>
            {profileMenuOpen && profiles.length > 1 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1">
                  {profiles.filter((p) => p.id !== loggedInProfileId).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { switchProfile(p.id); setProfileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                    >
                      {p.logo ? (
                        <img src={p.logo} alt="" className="w-6 h-6 rounded-md object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 9 }}>
                          {(p.internalName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {p.internalName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
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
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen dark:bg-slate-950">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
