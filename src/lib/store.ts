import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { AppSettings, PromptTemplate } from "../types";
import { builtInTemplates, defaultTemplate } from "./templates";

const defaultSettings: AppSettings = {
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  hotkey: "Ctrl+Alt+Shift+P",
  selectedTemplateId: defaultTemplate.id,
  customTemplates: [],
  builtInOverrides: {},
  autoCopyOnDone: false,
};

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load("settings.json", {
      defaults: defaultSettings as unknown as Record<string, unknown>,
      autoSave: false,
    });
  }
  return storeInstance;
}

interface AppState extends AppSettings {
  initialized: boolean;
  setSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getTemplate: () => PromptTemplate;
  init: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  ...defaultSettings,
  initialized: false,

  setSettings: async (settings) => {
    set((state) => ({ ...state, ...settings }));
    const store = await getStore();
    for (const [key, value] of Object.entries(settings)) {
      await store.set(key, value);
    }
    await store.save();
  },

  getTemplate: () => {
    const { selectedTemplateId, customTemplates, builtInOverrides } = get();
    const all = [
      ...builtInTemplates.map((t) => builtInOverrides[t.id] || t),
      ...customTemplates,
    ];
    return all.find((t) => t.id === selectedTemplateId) || defaultTemplate;
  },

  init: async () => {
    const store = await getStore();
    const updates: Partial<AppSettings> = {};
    for (const key of Object.keys(defaultSettings) as Array<keyof AppSettings>) {
      const value = await store.get(key);
      if (value !== undefined && value !== null) {
        (updates as Record<string, unknown>)[key] = value;
      }
    }
    set({ ...defaultSettings, ...updates, initialized: true });
  },
}));
