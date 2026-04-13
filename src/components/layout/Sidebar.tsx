import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, LogOut, FileText } from 'lucide-react';
import {
  LayoutDashboard, Users, Truck, Package, PenLine, LayoutTemplate, Settings
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kunden', label: 'Kunden', icon: Users },
  { to: '/rechnungen', label: 'Rechnungen', icon: FileText },
  { to: '/lieferscheine', label: 'Lieferscheine', icon: Truck },
  { to: '/artikel', label: 'Artikel', icon: Package },
  { to: '/schreiben', label: 'Schreiben', icon: PenLine },
  { to: '/vorlagen', label: 'Vorlagen', icon: LayoutTemplate },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, getLoggedInProfile } = useStore();
  const profile = getLoggedInProfile();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Jorge Faktura" className="w-9 h-9 rounded-xl" />
            <span className="font-bold text-slate-900 text-base">Jorge Faktura</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aktives Profil */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Angemeldet als</p>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-brand-50">
            {profile?.logo ? (
              <img src={profile.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                {(profile?.internalName || 'P').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">{profile?.internalName || '-'}</p>
              {profile?.companyName && (
                <p className="text-xs text-slate-500">{profile.companyName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Navigation</p>
          <div className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
          </div>
        </nav>

        {/* Abmelden */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </button>
        </div>
      </aside>
    </>
  );
}
