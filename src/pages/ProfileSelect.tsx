import React, { useState } from 'react';
import { ChevronRight, Plus, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ProfileSelect() {
  const { profiles, switchProfile, createProfile, logout } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSelect = (id: string) => {
    switchProfile(id);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const profile = createProfile(newName.trim());
    switchProfile(profile.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Profil auswählen</h1>
            <p className="text-sm text-slate-500">Mit welchem Profil möchtest du arbeiten?</p>
          </div>
        </div>

        {/* Profile list */}
        <div className="space-y-2 mb-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group"
            >
              {p.logo ? (
                <img src={p.logo} alt="" className="w-11 h-11 rounded-xl object-contain flex-shrink-0 bg-slate-100" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(p.internalName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.internalName}</p>
                {p.companyName && (
                  <p className="text-sm text-slate-500 truncate">{p.companyName}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>

        {/* New profile */}
        {showNew ? (
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }}
              placeholder="Profilname (z.B. Privat, Firma 2…)"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNew(false); setNewName(''); }}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 h-10 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Neues Profil erstellen
          </button>
        )}

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
