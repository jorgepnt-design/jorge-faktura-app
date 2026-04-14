import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Profile, Customer, Article, Template, Invoice, DeliveryNote, Letter, Receipt, Attachment,
} from '../types';
import {
  generateId,
  generateInvoiceNumber,
  generateDeliveryNoteNumber,
  generateCustomerNumber,
  generateReceiptNumber,
  todayISO,
} from '../utils/helpers';

// ── Sync debounce ─────────────────────────────────────────────────────────────
let syncTimer: ReturnType<typeof setTimeout> | null = null;

type CloudSnapshot = Pick<AppState,
  'profiles' | 'customers' | 'articles' | 'templates' | 'invoices' | 'deliveryNotes' | 'letters' | 'receipts' | 'attachments'
>;

// ── Interface ─────────────────────────────────────────────────────────────────
interface AppState {
  // ── Auth ────────────────────────────────────────────────────────────────────
  supabaseUserId: string | null;
  isLoading: boolean;

  // ── Data (same shape as before – all pages unchanged) ────────────────────────
  loggedInProfileId: string | null;
  profiles: Profile[];
  customers: Customer[];
  articles: Article[];
  templates: Template[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  letters: Letter[];
  receipts: Receipt[];
  attachments: Attachment[];

  // ── Auth actions (new) ───────────────────────────────────────────────────────
  restoreSession: () => Promise<void>;
  loginWithEmail: (email: string, pin: string) => Promise<boolean>;
  registerWithEmail: (
    email: string, pin: string, internalName: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;

  // ── Legacy (kept so existing pages compile unchanged) ────────────────────────
  loginWithProfile: (profileId: string, pin: string) => boolean;
  getLoggedInProfile: () => Profile | null;

  // ── Profile ──────────────────────────────────────────────────────────────────
  addProfile: (data: Omit<Profile, 'id' | 'createdAt' | 'invoiceCounter' | 'deliveryNoteCounter'>) => Profile;
  updateProfile: (id: string, data: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;

  // ── Customer ─────────────────────────────────────────────────────────────────
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'customerNumber'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // ── Article ──────────────────────────────────────────────────────────────────
  addArticle: (data: Omit<Article, 'id' | 'createdAt'>) => Article;
  updateArticle: (id: string, data: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  // ── Template ─────────────────────────────────────────────────────────────────
  addTemplate: (data: Omit<Template, 'id' | 'createdAt'>) => Template;
  updateTemplate: (id: string, data: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;

  // ── Invoice ──────────────────────────────────────────────────────────────────
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => void;

  // ── Delivery Note ─────────────────────────────────────────────────────────────
  addDeliveryNote: (data: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt' | 'deliveryNoteNumber'>) => DeliveryNote;
  updateDeliveryNote: (id: string, data: Partial<DeliveryNote>) => void;
  deleteDeliveryNote: (id: string) => void;
  duplicateDeliveryNote: (id: string) => void;

  // ── Letter ───────────────────────────────────────────────────────────────────
  addLetter: (data: Omit<Letter, 'id' | 'createdAt' | 'updatedAt'>) => Letter;
  updateLetter: (id: string, data: Partial<Letter>) => void;
  deleteLetter: (id: string) => void;
  duplicateLetter: (id: string) => void;

  // ── Receipt ──────────────────────────────────────────────────────────────────
  addReceipt: (data: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt' | 'receiptNumber'>) => Receipt;
  updateReceipt: (id: string, data: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;

  // ── Attachment ───────────────────────────────────────────────────────────────
  addAttachment: (data: Omit<Attachment, 'id' | 'createdAt'>) => Attachment;
  deleteAttachment: (id: string) => void;

  // ── Export / Import ──────────────────────────────────────────────────────────
  exportData: () => string;
  importData: (json: string) => boolean;

  // ── Internal ─────────────────────────────────────────────────────────────────
  _syncToCloud: () => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useStore = create<AppState>()((set, get) => {

  /** Debounced write to Supabase – fires 800 ms after the last change. */
  const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => get()._syncToCloud(), 800);
  };

  /** Read user data from Supabase and return a CloudSnapshot (or null). */
  const fetchCloud = async (userId: string): Promise<CloudSnapshot | null> => {
    const { data: row, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !row) return null;

    return {
      profiles:      row.data?.profiles      ?? [],
      customers:     row.data?.customers     ?? [],
      articles:      row.data?.articles      ?? [],
      templates:     row.data?.templates     ?? [],
      invoices:      row.data?.invoices      ?? [],
      deliveryNotes: row.data?.deliveryNotes ?? [],
      letters:       row.data?.letters       ?? [],
      receipts:      row.data?.receipts      ?? [],
      attachments:   row.data?.attachments   ?? [],
    };
  };

  /** Apply a cloud snapshot to the store and set the logged-in profile. */
  const hydrateFromSnapshot = (userId: string, snap: CloudSnapshot) => {
    const profileId = snap.profiles[0]?.id ?? userId;
    set({ supabaseUserId: userId, loggedInProfileId: profileId, isLoading: false, ...snap });
  };

  return {
    supabaseUserId:   null,
    isLoading:        true,   // true on init so App shows spinner while checking session
    loggedInProfileId: null,
    profiles:      [],
    customers:     [],
    articles:      [],
    templates:     [],
    invoices:      [],
    deliveryNotes: [],
    letters:       [],
    receipts:      [],
    attachments:   [],

    // ── Auth ──────────────────────────────────────────────────────────────────

    restoreSession: async () => {
      set({ isLoading: true });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { set({ isLoading: false }); return; }

        const snap = await fetchCloud(session.user.id);
        if (snap) {
          hydrateFromSnapshot(session.user.id, snap);
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.error('restoreSession:', err);
        set({ isLoading: false });
      }
    },

    loginWithEmail: async (email, pin) => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pin });
        if (error || !data.user) { set({ isLoading: false }); return false; }

        let snap = await fetchCloud(data.user.id);

        // First-ever login: no user_data row yet → create one with a blank profile
        if (!snap) {
          const profile = makeBlankProfile(data.user.id, email.split('@')[0]);
          snap = emptySnapshot([profile]);
          await supabase.from('user_data').insert({
            user_id: data.user.id,
            data: snap,
          });
        }

        hydrateFromSnapshot(data.user.id, snap);
        return true;
      } catch (err) {
        console.error('loginWithEmail:', err);
        set({ isLoading: false });
        return false;
      }
    },

    registerWithEmail: async (email, pin, internalName) => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase.auth.signUp({ email, password: pin });

        if (error) {
          set({ isLoading: false });
          return { success: false, error: translateError(error.message) };
        }
        if (!data.user) {
          set({ isLoading: false });
          return { success: false, error: 'Registrierung fehlgeschlagen.' };
        }

        const profile = makeBlankProfile(data.user.id, internalName);
        const snap    = emptySnapshot([profile]);

        await supabase.from('user_data').insert({ user_id: data.user.id, data: snap });

        hydrateFromSnapshot(data.user.id, snap);
        return { success: true };
      } catch (err) {
        console.error('registerWithEmail:', err);
        set({ isLoading: false });
        return { success: false, error: 'Ein Fehler ist aufgetreten.' };
      }
    },

    logout: async () => {
      await supabase.auth.signOut();
      set({
        supabaseUserId: null,
        loggedInProfileId: null,
        profiles: [], customers: [], articles: [], templates: [],
        invoices: [], deliveryNotes: [], letters: [], receipts: [], attachments: [],
      });
    },

    changePassword: async (newPin) => {
      const { error } = await supabase.auth.updateUser({ password: newPin });
      if (error) return { success: false, error: translateError(error.message) };
      return { success: true };
    },

    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) return { success: false, error: translateError(error.message) };
      return { success: true };
    },

    // ── Legacy helpers ─────────────────────────────────────────────────────────

    loginWithProfile: (profileId, pin) => {
      const profile = get().profiles.find((p) => p.id === profileId);
      if (profile && profile.pin === pin) {
        set({ loggedInProfileId: profileId });
        return true;
      }
      return false;
    },

    getLoggedInProfile: () => {
      const { profiles, loggedInProfileId } = get();
      return profiles.find((p) => p.id === loggedInProfileId) ?? null;
    },

    // ── Profile ───────────────────────────────────────────────────────────────

    addProfile: (data) => {
      const profile: Profile = {
        ...data,
        id: generateId(),
        invoiceCounter: 0,
        deliveryNoteCounter: 0,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ profiles: [...s.profiles, profile] }));
      scheduleSync();
      return profile;
    },

    updateProfile: (id, data) => {
      set((s) => ({ profiles: s.profiles.map((p) => p.id === id ? { ...p, ...data } : p) }));
      scheduleSync();
    },

    deleteProfile: (id) => {
      set((s) => ({
        profiles: s.profiles.filter((p) => p.id !== id),
        loggedInProfileId: s.loggedInProfileId === id ? null : s.loggedInProfileId,
      }));
      scheduleSync();
    },

    duplicateProfile: (id) => {
      const src = get().profiles.find((p) => p.id === id);
      if (!src) return;
      const copy: Profile = {
        ...src,
        id: generateId(),
        internalName: `${src.internalName} (Kopie)`,
        pin: '1234',
        invoiceCounter: 0,
        deliveryNoteCounter: 0,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ profiles: [...s.profiles, copy] }));
      scheduleSync();
    },

    // ── Customer ──────────────────────────────────────────────────────────────

    addCustomer: (data) => {
      const count    = get().customers.filter((c) => c.profileId === data.profileId).length;
      const customer: Customer = {
        ...data,
        id: generateId(),
        customerNumber: generateCustomerNumber(count),
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ customers: [...s.customers, customer] }));
      scheduleSync();
      return customer;
    },

    updateCustomer: (id, data) => {
      set((s) => ({ customers: s.customers.map((c) => c.id === id ? { ...c, ...data } : c) }));
      scheduleSync();
    },

    deleteCustomer: (id) => {
      set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
      scheduleSync();
    },

    // ── Article ───────────────────────────────────────────────────────────────

    addArticle: (data) => {
      const article: Article = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      set((s) => ({ articles: [...s.articles, article] }));
      scheduleSync();
      return article;
    },

    updateArticle: (id, data) => {
      set((s) => ({ articles: s.articles.map((a) => a.id === id ? { ...a, ...data } : a) }));
      scheduleSync();
    },

    deleteArticle: (id) => {
      set((s) => ({ articles: s.articles.filter((a) => a.id !== id) }));
      scheduleSync();
    },

    // ── Template ──────────────────────────────────────────────────────────────

    addTemplate: (data) => {
      const template: Template = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      set((s) => ({ templates: [...s.templates, template] }));
      scheduleSync();
      return template;
    },

    updateTemplate: (id, data) => {
      set((s) => ({ templates: s.templates.map((t) => t.id === id ? { ...t, ...data } : t) }));
      scheduleSync();
    },

    deleteTemplate: (id) => {
      set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
      scheduleSync();
    },

    // ── Invoice ───────────────────────────────────────────────────────────────

    addInvoice: (data) => {
      const profile = get().profiles.find((p) => p.id === data.profileId);
      if (!profile) throw new Error('Profile not found');
      const counter = profile.invoiceCounter + 1;
      const invoice: Invoice = {
        ...data,
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(counter),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        invoices: [...s.invoices, invoice],
        profiles: s.profiles.map((p) => p.id === data.profileId ? { ...p, invoiceCounter: counter } : p),
      }));
      scheduleSync();
      return invoice;
    },

    updateInvoice: (id, data) => {
      set((s) => ({
        invoices: s.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
        ),
      }));
      scheduleSync();
    },

    deleteInvoice: (id) => {
      set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) }));
      scheduleSync();
    },

    duplicateInvoice: (id) => {
      const src     = get().invoices.find((inv) => inv.id === id);
      if (!src) return;
      const profile = get().profiles.find((p) => p.id === src.profileId);
      if (!profile) return;
      const counter = profile.invoiceCounter + 1;
      const copy: Invoice = {
        ...src,
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(counter),
        status: 'draft',
        invoiceDate: todayISO(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        invoices: [...s.invoices, copy],
        profiles: s.profiles.map((p) => p.id === src.profileId ? { ...p, invoiceCounter: counter } : p),
      }));
      scheduleSync();
    },

    // ── Delivery Note ─────────────────────────────────────────────────────────

    addDeliveryNote: (data) => {
      const profile = get().profiles.find((p) => p.id === data.profileId);
      if (!profile) throw new Error('Profile not found');
      const counter = profile.deliveryNoteCounter + 1;
      const note: DeliveryNote = {
        ...data,
        id: generateId(),
        deliveryNoteNumber: generateDeliveryNoteNumber(counter),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        deliveryNotes: [...s.deliveryNotes, note],
        profiles: s.profiles.map((p) =>
          p.id === data.profileId ? { ...p, deliveryNoteCounter: counter } : p
        ),
      }));
      scheduleSync();
      return note;
    },

    updateDeliveryNote: (id, data) => {
      set((s) => ({
        deliveryNotes: s.deliveryNotes.map((n) =>
          n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
        ),
      }));
      scheduleSync();
    },

    deleteDeliveryNote: (id) => {
      set((s) => ({ deliveryNotes: s.deliveryNotes.filter((n) => n.id !== id) }));
      scheduleSync();
    },

    duplicateDeliveryNote: (id) => {
      const src = get().deliveryNotes.find((n) => n.id === id);
      if (!src) return;
      const profile = get().profiles.find((p) => p.id === src.profileId);
      if (!profile) return;
      const counter = profile.deliveryNoteCounter + 1;
      const copy: DeliveryNote = {
        ...src,
        id: generateId(),
        deliveryNoteNumber: generateDeliveryNoteNumber(counter),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        deliveryNotes: [...s.deliveryNotes, copy],
        profiles: s.profiles.map((p) => p.id === src.profileId ? { ...p, deliveryNoteCounter: counter } : p),
      }));
      scheduleSync();
    },

    // ── Letter ────────────────────────────────────────────────────────────────

    addLetter: (data) => {
      const letter: Letter = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ letters: [...s.letters, letter] }));
      scheduleSync();
      return letter;
    },

    updateLetter: (id, data) => {
      set((s) => ({
        letters: s.letters.map((l) =>
          l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
        ),
      }));
      scheduleSync();
    },

    deleteLetter: (id) => {
      set((s) => ({ letters: s.letters.filter((l) => l.id !== id) }));
      scheduleSync();
    },

    duplicateLetter: (id) => {
      const src = get().letters.find((l) => l.id === id);
      if (!src) return;
      const copy: Letter = {
        ...src,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ letters: [...s.letters, copy] }));
      scheduleSync();
    },

    // ── Receipt ───────────────────────────────────────────────────────────────

    addReceipt: (data) => {
      const profile = get().profiles.find((p) => p.id === data.profileId);
      if (!profile) throw new Error('Profile not found');
      const counter = (profile.receiptCounter ?? 0) + 1;
      const receipt: Receipt = {
        ...data,
        id: generateId(),
        receiptNumber: generateReceiptNumber(counter),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({
        receipts: [...s.receipts, receipt],
        profiles: s.profiles.map((p) => p.id === data.profileId ? { ...p, receiptCounter: counter } : p),
      }));
      scheduleSync();
      return receipt;
    },

    updateReceipt: (id, data) => {
      set((s) => ({
        receipts: s.receipts.map((r) =>
          r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
        ),
      }));
      scheduleSync();
    },

    deleteReceipt: (id) => {
      set((s) => ({ receipts: s.receipts.filter((r) => r.id !== id) }));
      scheduleSync();
    },

    // ── Attachment ────────────────────────────────────────────────────────────

    addAttachment: (data) => {
      const attachment: Attachment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      set((s) => ({ attachments: [...s.attachments, attachment] }));
      scheduleSync();
      return attachment;
    },

    deleteAttachment: (id) => {
      set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) }));
      scheduleSync();
    },

    // ── Export / Import ───────────────────────────────────────────────────────

    exportData: () => {
      const { profiles, customers, articles, templates, invoices, deliveryNotes, letters, receipts, attachments } = get();
      return JSON.stringify(
        { profiles, customers, articles, templates, invoices, deliveryNotes, letters, receipts, attachments,
          exportedAt: new Date().toISOString() },
        null, 2
      );
    },

    importData: (json) => {
      try {
        const d = JSON.parse(json);
        set({
          profiles:      d.profiles      || [],
          customers:     d.customers     || [],
          articles:      d.articles      || [],
          templates:     d.templates     || [],
          invoices:      d.invoices      || [],
          deliveryNotes: d.deliveryNotes || [],
          letters:       d.letters       || [],
          receipts:      d.receipts      || [],
          attachments:   d.attachments   || [],
        });
        scheduleSync();
        return true;
      } catch {
        return false;
      }
    },

    // ── Internal cloud sync ───────────────────────────────────────────────────

    _syncToCloud: async () => {
      const { supabaseUserId, profiles, customers, articles, templates,
              invoices, deliveryNotes, letters, receipts, attachments } = get();
      if (!supabaseUserId) return;

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id:    supabaseUserId,
          data:       { profiles, customers, articles, templates, invoices, deliveryNotes, letters, receipts, attachments },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) console.error('Cloud sync error:', error.message);
    },
  };
});

// ── Private helpers ───────────────────────────────────────────────────────────

function makeBlankProfile(id: string, internalName: string): Profile {
  return {
    id,
    internalName,
    pin: '',
    companyName: '', personName: '', address: '', zipCode: '',
    city: '', country: 'Deutschland', email: '', phone: '',
    mobile: '', website: '', taxNumber: '', vatId: '',
    bankName: '', iban: '', bic: '',
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
    logo: null, logoNaturalWidth: 0, logoNaturalHeight: 0, signature: null,
    signatureOnInvoice: false, signatureOnDeliveryNote: false, signatureOnLetter: false, logoOnPdf: true,
    pdfFooter: '',
    invoiceCounter: 0, deliveryNoteCounter: 0, receiptCounter: 0,
    createdAt: new Date().toISOString(),
  };
}

function emptySnapshot(profiles: Profile[]): CloudSnapshot {
  return { profiles, customers: [], articles: [], templates: [], invoices: [], deliveryNotes: [], letters: [], receipts: [], attachments: [] };
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))   return 'E-Mail oder PIN ist falsch.';
  if (msg.includes('Email not confirmed'))          return 'Bitte bestätigen Sie zuerst Ihre E-Mail.';
  if (msg.includes('User already registered'))      return 'Diese E-Mail ist bereits registriert.';
  if (msg.includes('Password should be at least'))  return 'PIN muss mindestens 6 Zeichen haben.';
  if (msg.includes('Unable to validate email'))     return 'Ungültige E-Mail-Adresse.';
  return msg;
}
