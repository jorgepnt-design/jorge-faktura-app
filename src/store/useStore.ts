import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Profile,
  Customer,
  Article,
  Template,
  Invoice,
  DeliveryNote,
  Letter,
  AppSettings,
} from '../types';
import {
  generateId,
  generateInvoiceNumber,
  generateDeliveryNoteNumber,
  generateCustomerNumber,
  calculateLineItem,
  calculateInvoiceTotals,
  todayISO,
} from '../utils/helpers';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  settings: AppSettings;

  // Profiles
  profiles: Profile[];
  activeProfileId: string | null;

  // Data
  customers: Customer[];
  articles: Article[];
  templates: Template[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  letters: Letter[];

  // Auth actions
  login: (pin: string) => boolean;
  logout: () => void;
  updatePin: (pin: string) => void;

  // Profile actions
  addProfile: (data: Omit<Profile, 'id' | 'createdAt' | 'invoiceCounter' | 'deliveryNoteCounter'>) => Profile;
  updateProfile: (id: string, data: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => Profile | null;

  // Customer actions
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'customerNumber'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Article actions
  addArticle: (data: Omit<Article, 'id' | 'createdAt'>) => Article;
  updateArticle: (id: string, data: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  // Template actions
  addTemplate: (data: Omit<Template, 'id' | 'createdAt'>) => Template;
  updateTemplate: (id: string, data: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;

  // Invoice actions
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => void;

  // Delivery note actions
  addDeliveryNote: (data: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt' | 'deliveryNoteNumber'>) => DeliveryNote;
  updateDeliveryNote: (id: string, data: Partial<DeliveryNote>) => void;
  deleteDeliveryNote: (id: string) => void;

  // Letter actions
  addLetter: (data: Omit<Letter, 'id' | 'createdAt' | 'updatedAt'>) => Letter;
  updateLetter: (id: string, data: Partial<Letter>) => void;
  deleteLetter: (id: string) => void;

  // Export/Import
  exportData: () => string;
  importData: (json: string) => boolean;
}

const DEFAULT_PIN = '1234';

function createDefaultProfile(): Profile {
  return {
    id: generateId(),
    internalName: 'Mein Profil',
    companyName: 'Mein Unternehmen',
    personName: '',
    address: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    taxNumber: '',
    vatId: '',
    bankName: '',
    iban: '',
    bic: '',
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
    logo: null,
    pdfFooter: '',
    invoiceCounter: 0,
    deliveryNoteCounter: 0,
    createdAt: new Date().toISOString(),
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      settings: { pin: DEFAULT_PIN, currency: 'EUR', dateFormat: 'de-DE' },
      profiles: [],
      activeProfileId: null,
      customers: [],
      articles: [],
      templates: [],
      invoices: [],
      deliveryNotes: [],
      letters: [],

      login: (pin) => {
        if (pin === get().settings.pin) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      updatePin: (pin) =>
        set((s) => ({ settings: { ...s.settings, pin } })),

      addProfile: (data) => {
        const profile: Profile = {
          ...data,
          id: generateId(),
          invoiceCounter: 0,
          deliveryNoteCounter: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          profiles: [...s.profiles, profile],
          activeProfileId: s.activeProfileId ?? profile.id,
        }));
        return profile;
      },

      updateProfile: (id, data) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deleteProfile: (id) =>
        set((s) => {
          const remaining = s.profiles.filter((p) => p.id !== id);
          return {
            profiles: remaining,
            activeProfileId:
              s.activeProfileId === id
                ? remaining[0]?.id ?? null
                : s.activeProfileId,
          };
        }),

      duplicateProfile: (id) => {
        const src = get().profiles.find((p) => p.id === id);
        if (!src) return;
        const copy: Profile = {
          ...src,
          id: generateId(),
          internalName: `${src.internalName} (Kopie)`,
          invoiceCounter: 0,
          deliveryNoteCounter: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ profiles: [...s.profiles, copy] }));
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId) ?? null;
      },

      addCustomer: (data) => {
        const profile = get().profiles.find((p) => p.id === data.profileId);
        const count = get().customers.filter((c) => c.profileId === data.profileId).length;
        const customer: Customer = {
          ...data,
          id: generateId(),
          customerNumber: generateCustomerNumber(count),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [...s.customers, customer] }));
        return customer;
      },

      updateCustomer: (id, data) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      addArticle: (data) => {
        const article: Article = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ articles: [...s.articles, article] }));
        return article;
      },

      updateArticle: (id, data) =>
        set((s) => ({
          articles: s.articles.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteArticle: (id) =>
        set((s) => ({ articles: s.articles.filter((a) => a.id !== id) })),

      addTemplate: (data) => {
        const template: Template = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ templates: [...s.templates, template] }));
        return template;
      },

      updateTemplate: (id, data) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

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
          profiles: s.profiles.map((p) =>
            p.id === data.profileId ? { ...p, invoiceCounter: counter } : p
          ),
        }));
        return invoice;
      },

      updateInvoice: (id, data) =>
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
          ),
        })),

      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) })),

      duplicateInvoice: (id) => {
        const src = get().invoices.find((inv) => inv.id === id);
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
          profiles: s.profiles.map((p) =>
            p.id === src.profileId ? { ...p, invoiceCounter: counter } : p
          ),
        }));
      },

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
        return note;
      },

      updateDeliveryNote: (id, data) =>
        set((s) => ({
          deliveryNotes: s.deliveryNotes.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
          ),
        })),

      deleteDeliveryNote: (id) =>
        set((s) => ({ deliveryNotes: s.deliveryNotes.filter((n) => n.id !== id) })),

      addLetter: (data) => {
        const letter: Letter = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ letters: [...s.letters, letter] }));
        return letter;
      },

      updateLetter: (id, data) =>
        set((s) => ({
          letters: s.letters.map((l) =>
            l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
          ),
        })),

      deleteLetter: (id) =>
        set((s) => ({ letters: s.letters.filter((l) => l.id !== id) })),

      exportData: () => {
        const { profiles, customers, articles, templates, invoices, deliveryNotes, letters, settings } = get();
        return JSON.stringify({ profiles, customers, articles, templates, invoices, deliveryNotes, letters, settings, exportedAt: new Date().toISOString() }, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            profiles: data.profiles || [],
            customers: data.customers || [],
            articles: data.articles || [],
            templates: data.templates || [],
            invoices: data.invoices || [],
            deliveryNotes: data.deliveryNotes || [],
            letters: data.letters || [],
            activeProfileId: data.profiles?.[0]?.id ?? null,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'jorge-faktura-store',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Initialize with a default profile if none exist
        if (state && state.profiles.length === 0) {
          const defaultProfile = createDefaultProfile();
          state.profiles = [defaultProfile];
          state.activeProfileId = defaultProfile.id;
        }
      },
    }
  )
);
