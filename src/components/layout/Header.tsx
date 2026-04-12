import React from 'react';
import { Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HeaderProps {
  title: string;
  onMenuOpen: () => void;
}

export default function Header({ title, onMenuOpen }: HeaderProps) {
  const { getActiveProfile } = useStore();
  const profile = getActiveProfile();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 safe-top">
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      <h1 className="text-base font-semibold text-slate-900 truncate max-w-[180px] text-center">
        {title}
      </h1>

      <div className="w-10 h-10 flex items-center justify-center">
        {profile?.logo ? (
          <img
            src={profile.logo}
            alt={profile.internalName}
            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
            {(profile?.internalName || profile?.companyName || 'P').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
