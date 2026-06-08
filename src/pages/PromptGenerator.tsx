import React, { useState, useCallback, useRef } from 'react';
import {
  Wand2, ChevronRight, ChevronLeft, Check, Copy, Download, BookmarkPlus,
  RotateCcw, Sparkles, Zap, User, Target, Users, MessageSquare,
  Palette, FileOutput, Globe, Languages, AlignLeft, Maximize2,
  Mic, Instagram, Youtube, Mail, HelpCircle, BookOpen, Code2,
  Megaphone, Trash2, ChevronDown, X, GraduationCap,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardState {
  role: string;
  customRole: string;
  goal: string;
  audience: string;
  customAudience: string;
  topic: string;
  style: string;
  tone: string;
  outputType: string;
  language: string;
  translateToEnglish: boolean;
  format: string;
  length: string;
}

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  state: WizardState;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'marketing-experte', label: 'Marketing-Experte', icon: Megaphone },
  { value: 'lehrer', label: 'Lehrer / Trainer', icon: GraduationCap },
  { value: 'entwickler', label: 'Entwickler', icon: Code2 },
  { value: 'copywriter', label: 'Copywriter', icon: MessageSquare },
  { value: 'berater', label: 'Berater', icon: User },
  { value: 'wissenschaftler', label: 'Wissenschaftler', icon: BookOpen },
  { value: 'journalist', label: 'Journalist', icon: AlignLeft },
  { value: 'coach', label: 'Coach / Mentor', icon: Sparkles },
  { value: 'custom', label: 'Eigene Rolle…', icon: Zap },
];

const GOALS = [
  { value: 'informieren', label: 'Informieren', desc: 'Wissen vermitteln & erklären' },
  { value: 'überzeugen', label: 'Überzeugen', desc: 'Argumente & Calls-to-Action' },
  { value: 'unterhalten', label: 'Unterhalten', desc: 'Spannendes & Kreatives' },
  { value: 'zusammenfassen', label: 'Zusammenfassen', desc: 'Kompakte Übersichten' },
  { value: 'analysieren', label: 'Analysieren', desc: 'Tiefgehende Auswertungen' },
  { value: 'erstellen', label: 'Erstellen / Generieren', desc: 'Neuen Inhalt produzieren' },
  { value: 'erklären', label: 'Erklären', desc: 'Schritt-für-Schritt verständlich' },
  { value: 'inspirieren', label: 'Inspirieren', desc: 'Ideen & Kreativimpulse' },
];

const AUDIENCES = [
  { value: 'anfänger', label: 'Anfänger', desc: 'Keine Vorkenntnisse nötig' },
  { value: 'experten', label: 'Experten', desc: 'Hohes Fachwissen vorausgesetzt' },
  { value: 'manager', label: 'Manager / Führungskräfte', desc: 'Entscheidungsträger' },
  { value: 'kinder', label: 'Kinder / Jugendliche', desc: 'Einfache, klare Sprache' },
  { value: 'studenten', label: 'Studenten', desc: 'Akademisches Niveau' },
  { value: 'kunden', label: 'Kunden / Käufer', desc: 'Kaufentscheidung treffen' },
  { value: 'allgemein', label: 'Allgemeinpublikum', desc: 'Breite Zielgruppe' },
  { value: 'custom', label: 'Eigene Zielgruppe…', desc: 'Selbst definieren' },
];

const STYLES = [
  { value: 'professionell', label: 'Professionell', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'locker', label: 'Locker & Freundlich', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'kreativ', label: 'Kreativ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'technisch', label: 'Technisch', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'inspirierend', label: 'Inspirierend', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { value: 'akademisch', label: 'Akademisch', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
];

const OUTPUT_TYPES = [
  { value: 'verbreitungstext', label: 'Verbreitungstext', desc: 'Marketing / Ads', icon: Megaphone },
  { value: 'social-media', label: 'Social-Media-Post', desc: 'Instagram, LinkedIn, X', icon: Instagram },
  { value: 'video-skript', label: 'Videodrehbuch', desc: 'YouTube, TikTok, Reels', icon: Youtube },
  { value: 'email', label: 'E-Mail', desc: 'Newsletter, Kaltakquise', icon: Mail },
  { value: 'faq', label: 'FAQ', desc: 'Häufige Fragen & Antworten', icon: HelpCircle },
  { value: 'zusammenfassung', label: 'Zusammenfassung', desc: 'Kompakter Überblick', icon: AlignLeft },
  { value: 'bildungsinhalt', label: 'Bildungsinhalt', desc: 'Lernmaterialien & Kurse', icon: GraduationCap },
  { value: 'technisch', label: 'Technische Erklärung', desc: 'Dokumentation & Guides', icon: Code2 },
];

const FORMATS = [
  { value: 'text', label: 'Fließtext' },
  { value: 'liste', label: 'Aufzählungsliste' },
  { value: 'tabelle', label: 'Tabelle' },
  { value: 'schritt-fuer-schritt', label: 'Schritt-für-Schritt' },
];

const LENGTHS = [
  { value: 'kurz', label: 'Kurz', desc: '~100–200 Wörter' },
  { value: 'mittel', label: 'Mittel', desc: '~300–500 Wörter' },
  { value: 'ausführlich', label: 'Ausführlich', desc: '~700–1200 Wörter' },
];

const LANGUAGES = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch', 'Italienisch', 'Portugiesisch'];

const QUICK_TEMPLATES = [
  {
    id: 'instagram',
    label: 'Instagram Post',
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    state: {
      role: 'marketing-experte', customRole: '', goal: 'überzeugen',
      audience: 'kunden', customAudience: '', topic: '',
      style: 'kreativ', tone: 'informell', outputType: 'social-media',
      language: 'Deutsch', translateToEnglish: false, format: 'text', length: 'kurz',
    },
  },
  {
    id: 'youtube',
    label: 'YouTube Skript',
    icon: Youtube,
    color: 'from-red-500 to-orange-500',
    state: {
      role: 'copywriter', customRole: '', goal: 'unterhalten',
      audience: 'allgemein', customAudience: '', topic: '',
      style: 'locker', tone: 'informell', outputType: 'video-skript',
      language: 'Deutsch', translateToEnglish: false, format: 'schritt-fuer-schritt', length: 'ausführlich',
    },
  },
  {
    id: 'email',
    label: 'Marketing E-Mail',
    icon: Mail,
    color: 'from-blue-500 to-cyan-500',
    state: {
      role: 'copywriter', customRole: '', goal: 'überzeugen',
      audience: 'kunden', customAudience: '', topic: '',
      style: 'professionell', tone: 'formell', outputType: 'email',
      language: 'Deutsch', translateToEnglish: false, format: 'text', length: 'mittel',
    },
  },
  {
    id: 'bildung',
    label: 'Lerninhalt',
    icon: GraduationCap,
    color: 'from-green-500 to-teal-500',
    state: {
      role: 'lehrer', customRole: '', goal: 'erklären',
      audience: 'anfänger', customAudience: '', topic: '',
      style: 'professionell', tone: 'formell', outputType: 'bildungsinhalt',
      language: 'Deutsch', translateToEnglish: false, format: 'schritt-fuer-schritt', length: 'ausführlich',
    },
  },
];

// ─── Prompt Generator ────────────────────────────────────────────────────────

function generatePrompt(s: WizardState): string {
  const roleLabel = s.role === 'custom' ? s.customRole : ROLES.find(r => r.value === s.role)?.label ?? s.role;
  const goalLabel = GOALS.find(g => g.value === s.goal)?.label ?? s.goal;
  const audienceLabel = s.audience === 'custom' ? s.customAudience : AUDIENCES.find(a => a.value === s.audience)?.label ?? s.audience;
  const styleLabel = STYLES.find(st => st.value === s.style)?.label ?? s.style;
  const outputLabel = OUTPUT_TYPES.find(o => o.value === s.outputType)?.label ?? s.outputType;
  const formatLabel = FORMATS.find(f => f.value === s.format)?.label ?? s.format;
  const lengthLabel = LENGTHS.find(l => l.value === s.length)?.label ?? s.length;
  const toneLabel = s.tone === 'formell' ? 'formell' : 'informell';

  if (s.language === 'Englisch' || s.translateToEnglish) {
    return `You are a ${roleLabel}.

Your task: ${goalLabel} on the topic "${s.topic || '[Your topic here]'}".

Target audience: ${audienceLabel}

Style: ${styleLabel}, ${toneLabel}

Output format: ${outputLabel}
Answer format: ${formatLabel}
Length / detail: ${lengthLabel}

Expected output:
Please create a well-structured ${outputLabel.toLowerCase()} that clearly and effectively addresses the topic for the target audience. Use a ${styleLabel.toLowerCase()} and ${toneLabel} tone throughout.`;
  }

  return `Du bist ein ${roleLabel}.

Deine Aufgabe: ${goalLabel} zum Thema "${s.topic || '[Dein Thema hier eintragen]'}".

Zielgruppe: ${audienceLabel}

Stil: ${styleLabel}, ${toneLabel}

Ausgabetyp: ${outputLabel}
Antwortformat: ${formatLabel}
Länge / Detailgrad: ${lengthLabel}

Erwartete Ausgabe:
Erstelle einen klar strukturierten ${outputLabel.toLowerCase()}, der das Thema für die Zielgruppe verständlich und wirkungsvoll aufbereitet. Verwende dabei einen ${styleLabel.toLowerCase()}en, ${toneLabel}en Ton.`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);
  const stepLabels = ['Rolle', 'Ziel', 'Zielgruppe', 'Thema', 'Stil', 'Optionen'];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Schritt {current} von {total}
        </span>
        <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-medium hidden sm:block transition-colors ${
              i + 1 < current
                ? 'text-brand-600 dark:text-brand-400'
                : i + 1 === current
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SelectCard({
  selected, onClick, children, className = '',
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left p-3 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400 shadow-sm'
          : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-slate-800'
      } ${className}`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const emptyState: WizardState = {
  role: '', customRole: '', goal: '', audience: '', customAudience: '',
  topic: '', style: '', tone: 'formell', outputType: '',
  language: 'Deutsch', translateToEnglish: false, format: 'text', length: 'mittel',
};

export default function PromptGenerator() {
  const [step, setStep] = useState(0); // 0 = landing / templates
  const [state, setState] = useState<WizardState>(emptyState);
  const [copied, setCopied] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try { return JSON.parse(localStorage.getItem('pg_saved') || '[]'); } catch { return []; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const TOTAL_STEPS = 6;

  const update = useCallback((patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const canNext = useCallback(() => {
    switch (step) {
      case 1: return !!(state.role && (state.role !== 'custom' || state.customRole.trim()));
      case 2: return !!state.goal;
      case 3: return !!(state.audience && (state.audience !== 'custom' || state.customAudience.trim()));
      case 4: return !!state.topic.trim();
      case 5: return !!state.style;
      case 6: return !!state.outputType;
      default: return true;
    }
  }, [step, state]);

  const generatedPrompt = generatePrompt(state);

  function applyTemplate(t: typeof QUICK_TEMPLATES[0]) {
    setState(prev => ({ ...prev, ...t.state }));
    setStep(4); // jump to topic step so user fills in their topic
  }

  function reset() {
    setState(emptyState);
    setStep(0);
    setAdvancedOpen(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([generatedPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSave() {
    const name = saveName.trim() || `Prompt ${new Date().toLocaleDateString('de-DE')}`;
    const entry: SavedPrompt = {
      id: Date.now().toString(),
      name,
      prompt: generatedPrompt,
      state: { ...state },
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...savedPrompts];
    setSavedPrompts(updated);
    localStorage.setItem('pg_saved', JSON.stringify(updated));
    setSaveModalOpen(false);
    setSaveName('');
  }

  function deletePrompt(id: string) {
    const updated = savedPrompts.filter(p => p.id !== id);
    setSavedPrompts(updated);
    localStorage.setItem('pg_saved', JSON.stringify(updated));
  }

  function loadPrompt(p: SavedPrompt) {
    setState(p.state);
    setStep(7);
    setHistoryOpen(false);
  }

  // ─── Render Wizard Steps ─────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 0: Landing ──
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-lg">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Prompt Generator</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm">
                Erstelle professionelle ChatGPT-Prompts in wenigen Schritten – strukturiert, klar und wiederverwendbar.
              </p>
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Schnellstart mit Vorlage
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_TEMPLATES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-150 text-center"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">oder von vorne beginnen</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Neuen Prompt erstellen
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );

      // ── Step 1: Rolle ──
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-brand-500" />
                Welche Rolle soll ChatGPT einnehmen?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Wähle eine Experten-Rolle aus.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <SelectCard key={r.value} selected={state.role === r.value} onClick={() => update({ role: r.value })}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        state.role === r.value ? 'bg-brand-100 dark:bg-brand-800' : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${state.role === r.value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{r.label}</span>
                    </div>
                  </SelectCard>
                );
              })}
            </div>
            {state.role === 'custom' && (
              <input
                autoFocus
                type="text"
                placeholder="z. B. UX Designer, Finanzberater…"
                value={state.customRole}
                onChange={e => update({ customRole: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            )}
          </div>
        );

      // ── Step 2: Ziel ──
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-500" />
                Was ist das Ziel deines Prompts?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Was soll ChatGPT für dich tun?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(g => (
                <SelectCard key={g.value} selected={state.goal === g.value} onClick={() => update({ goal: g.value })}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{g.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{g.desc}</p>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      // ── Step 3: Zielgruppe ──
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                Wer ist deine Zielgruppe?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">An wen richtet sich der Inhalt?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCES.map(a => (
                <SelectCard key={a.value} selected={state.audience === a.value} onClick={() => update({ audience: a.value })}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{a.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.desc}</p>
                </SelectCard>
              ))}
            </div>
            {state.audience === 'custom' && (
              <input
                autoFocus
                type="text"
                placeholder="z. B. Freelancer, Eltern, IT-Teams…"
                value={state.customAudience}
                onChange={e => update({ customAudience: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            )}
          </div>
        );

      // ── Step 4: Thema ──
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                Um welches Thema geht es?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Beschreibe kurz, was der Inhalt behandeln soll.</p>
            </div>
            <textarea
              autoFocus
              rows={4}
              placeholder="z. B. Vorteile von Intermittent Fasting für Berufstätige…"
              value={state.topic}
              onChange={e => update({ topic: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Je spezifischer das Thema, desto besser das Ergebnis.
            </p>
          </div>
        );

      // ── Step 5: Stil & Tonfall ──
      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-500" />
                Stil & Tonfall
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Wie soll der Inhalt klingen?</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Schreibstil</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map(s => (
                  <SelectCard key={s.value} selected={state.style === s.value} onClick={() => update({ style: s.value })}>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  </SelectCard>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Tonfall</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'formell', label: 'Formell', desc: 'Siezen, sachlich, respektvoll' },
                  { value: 'informell', label: 'Informell', desc: 'Duzen, locker, nahbar' },
                ].map(t => (
                  <SelectCard key={t.value} selected={state.tone === t.value} onClick={() => update({ tone: t.value })}>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </SelectCard>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Step 6: Output-Typ & Optionen ──
      case 6:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileOutput className="w-5 h-5 text-brand-500" />
                Output-Typ & Optionen
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Was soll ChatGPT ausgeben?</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_TYPES.map(o => {
                const Icon = o.icon;
                return (
                  <SelectCard key={o.value} selected={state.outputType === o.value} onClick={() => update({ outputType: o.value })}>
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${state.outputType === o.value ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{o.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{o.desc}</p>
                      </div>
                    </div>
                  </SelectCard>
                );
              })}
            </div>

            {/* Advanced Options */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setAdvancedOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  Erweiterte Optionen
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </button>
              {advancedOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                  {/* Language */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Ausgabesprache
                    </label>
                    <select
                      value={state.language}
                      onChange={e => update({ language: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* Translate toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5" /> Prompt ins Englische übersetzen
                    </label>
                    <button
                      onClick={() => update({ translateToEnglish: !state.translateToEnglish })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${state.translateToEnglish ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${state.translateToEnglish ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5" /> Antwortformat
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FORMATS.map(f => (
                        <button
                          key={f.value}
                          onClick={() => update({ format: f.value })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                            state.format === f.value
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:border-brand-400 dark:text-brand-300'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Length */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" /> Länge / Detailgrad
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LENGTHS.map(l => (
                        <button
                          key={l.value}
                          onClick={() => update({ length: l.value })}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors border text-center ${
                            state.length === l.value
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:border-brand-400 dark:text-brand-300'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                          }`}
                        >
                          <span className="block font-semibold">{l.label}</span>
                          <span className="text-[10px] opacity-70">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ── Step 7: Result ──
      case 7:
        return (
          <div className="space-y-5" ref={resultRef}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  Dein Prompt ist fertig!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kopiere ihn direkt in ChatGPT.</p>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Neu
              </button>
            </div>

            {/* Generated Prompt Box */}
            <div className="relative group">
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 border border-slate-700">
                <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                  {generatedPrompt}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopy}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-xs font-medium ${
                  copied
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-400 dark:text-green-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 bg-white dark:bg-slate-800'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>
              <button
                onClick={handleDownload}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 bg-white dark:bg-slate-800 transition-all text-xs font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => { setSaveName(''); setSaveModalOpen(true); }}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 bg-white dark:bg-slate-800 transition-all text-xs font-medium"
              >
                <BookmarkPlus className="w-4 h-4" />
                Speichern
              </button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                ROLES.find(r => r.value === state.role)?.label || state.customRole,
                GOALS.find(g => g.value === state.goal)?.label,
                AUDIENCES.find(a => a.value === state.audience)?.label || state.customAudience,
                STYLES.find(s => s.value === state.style)?.label,
                OUTPUT_TYPES.find(o => o.value === state.outputType)?.label,
                state.language !== 'Deutsch' ? state.language : null,
              ].filter(Boolean).map((chip, i) => (
                <span key={i} className="inline-flex text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                  {chip}
                </span>
              ))}
            </div>

            {/* Edit button */}
            <button
              onClick={() => setStep(1)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Prompt bearbeiten
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prompt Generator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Strukturierte Prompts für ChatGPT erstellen
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Gespeichert</span>
          {savedPrompts.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {savedPrompts.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Wizard Card ── */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          {step > 0 && step < 7 && (
            <StepIndicator current={step} total={TOTAL_STEPS} />
          )}

          {renderStep()}

          {/* Navigation */}
          {step > 0 && step < 7 && (
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
              <button
                onClick={() => {
                  if (step === TOTAL_STEPS) setStep(7);
                  else setStep(s => s + 1);
                }}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 text-white text-sm font-semibold transition-colors"
              >
                {step === TOTAL_STEPS ? (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Prompt generieren
                  </>
                ) : (
                  <>
                    Weiter
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Live Preview Card ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Live-Vorschau
              </p>
              {step > 0 && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                    copied ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Kopiert' : 'Kopieren'}
                </button>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 min-h-[160px] max-h-[360px] overflow-y-auto">
              {state.role || state.goal || state.topic ? (
                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {generatePrompt(state)}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-600 italic text-center mt-8">
                  Fange an, um eine Vorschau zu sehen…
                </p>
              )}
            </div>
          </div>

          {/* Checkliste */}
          {step > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Checkliste</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Rolle', done: !!(state.role && (state.role !== 'custom' || state.customRole)) },
                  { label: 'Ziel', done: !!state.goal },
                  { label: 'Zielgruppe', done: !!(state.audience && (state.audience !== 'custom' || state.customAudience)) },
                  { label: 'Thema', done: !!state.topic.trim() },
                  { label: 'Stil', done: !!state.style },
                  { label: 'Output-Typ', done: !!state.outputType },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.done ? 'bg-green-500' : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Saved Prompts Drawer ── */}
      {historyOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-brand-500" />
              Gespeicherte Prompts ({savedPrompts.length})
            </h3>
            <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          {savedPrompts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
              Noch keine gespeicherten Prompts.
            </p>
          ) : (
            <div className="space-y-2">
              {savedPrompts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{p.prompt.slice(0, 80)}…</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => loadPrompt(p)}
                      className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      title="Laden"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(p.prompt);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Kopieren"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePrompt(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Save Modal ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSaveModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Prompt speichern</h3>
            <input
              autoFocus
              type="text"
              placeholder="Name für diesen Prompt…"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
