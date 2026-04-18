import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useDarkMode } from '../../hooks/useDarkMode';

interface HeaderProps {
  title: string;
  onMenuOpen: () => void;
}

export default function Header({ title, onMenuOpen }: HeaderProps) {
  const { getLoggedInProfile } = useStore();
  const profile = getLoggedInProfile();
  const [dark, setDark] = useDarkMode();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 h-14 flex items-center justify-between px-4 safe-top">
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
      </button>

      <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-[140px] text-center">
        {title}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setDark(!dark)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dark mode umschalten"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="w-9 h-9 flex items-center justify-center">
          {profile?.logo ? (
            <img
              src={profile.logo}
              alt={profile.internalName}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
              {(profile?.internalName || 'P').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
