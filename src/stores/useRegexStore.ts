'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  RegexPreset,
  RegexEntry,
  RegexCategoryId,
} from '@/types/regex';
import { DEFAULT_CATEGORIES } from '@/types/regex';
import { db } from '@/db/database';
import { combineCategories } from '@/lib/regex/combiner';

interface RegexState {
  presets: RegexPreset[];
  activePresetId: string | null;
  isLoading: boolean;

  // Computed (derived in getters)
  activePreset: RegexPreset | null;
  combinedRegex: string;

  // Actions
  loadPresets: () => Promise<void>;
  createPreset: (name: string) => Promise<string>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string) => Promise<string>;
  renamePreset: (id: string, name: string) => Promise<void>;
  setActivePreset: (id: string) => void;

  // Entry actions (operate on active preset)
  addEntry: (
    categoryId: RegexCategoryId,
    entry: Omit<RegexEntry, 'id'>,
  ) => Promise<void>;
  updateEntry: (
    categoryId: RegexCategoryId,
    entryId: string,
    updates: Partial<RegexEntry>,
  ) => Promise<void>;
  removeEntry: (
    categoryId: RegexCategoryId,
    entryId: string,
  ) => Promise<void>;
  toggleEntry: (
    categoryId: RegexCategoryId,
    entryId: string,
  ) => Promise<void>;
  clearCategory: (categoryId: RegexCategoryId) => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(getPreset: () => RegexPreset | undefined) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const preset = getPreset();
    if (preset) {
      db.regexPresets.put(JSON.parse(JSON.stringify(preset))).catch(console.error);
    }
  }, 300);
}

function getActivePreset(state: { presets: RegexPreset[]; activePresetId: string | null }): RegexPreset | null {
  if (!state.activePresetId) return null;
  return state.presets.find((p) => p.id === state.activePresetId) ?? null;
}

function getCombinedRegex(state: { presets: RegexPreset[]; activePresetId: string | null }): string {
  const preset = getActivePreset(state);
  if (!preset) return '';
  return combineCategories(preset.categories);
}

export const useRegexStore = create<RegexState>()(
  immer((set, get) => ({
    presets: [],
    activePresetId: null,
    isLoading: false,

    get activePreset() {
      const state = get();
      return getActivePreset(state);
    },

    get combinedRegex() {
      const state = get();
      return getCombinedRegex(state);
    },

    async loadPresets() {
      set((state) => {
        state.isLoading = true;
      });
      try {
        const presets = await db.regexPresets.toArray();
        set((state) => {
          state.presets = presets;
          state.isLoading = false;
          if (presets.length > 0 && !state.activePresetId) {
            state.activePresetId = presets[0].id;
          }
        });
      } catch (error) {
        console.error('Failed to load presets:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    async createPreset(name: string) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newPreset: RegexPreset = {
        id,
        name,
        categories: DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          entries: [],
        })),
        createdAt: now,
        updatedAt: now,
      };
      await db.regexPresets.add(newPreset);
      set((state) => {
        state.presets.push(newPreset);
        state.activePresetId = id;
      });
      return id;
    },

    async deletePreset(id: string) {
      await db.regexPresets.delete(id);
      set((state) => {
        state.presets = state.presets.filter((p) => p.id !== id);
        if (state.activePresetId === id) {
          state.activePresetId = state.presets[0]?.id ?? null;
        }
      });
    },

    async duplicatePreset(id: string) {
      const source = get().presets.find((p) => p.id === id);
      if (!source) throw new Error(`Preset ${id} not found`);

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const duplicate: RegexPreset = {
        ...JSON.parse(JSON.stringify(source)),
        id: newId,
        name: `${source.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      };
      await db.regexPresets.add(duplicate);
      set((state) => {
        state.presets.push(duplicate);
        state.activePresetId = newId;
      });
      return newId;
    },

    async renamePreset(id: string, name: string) {
      set((state) => {
        const preset = state.presets.find((p) => p.id === id);
        if (preset) {
          preset.name = name;
          preset.updatedAt = new Date().toISOString();
        }
      });
      debouncedSave(() => get().presets.find((p) => p.id === id));
    },

    setActivePreset(id: string) {
      set((state) => {
        state.activePresetId = id;
      });
    },

    async addEntry(categoryId: RegexCategoryId, entry: Omit<RegexEntry, 'id'>) {
      const newEntry: RegexEntry = {
        ...entry,
        id: crypto.randomUUID(),
      };
      set((state) => {
        const preset = state.presets.find(
          (p) => p.id === state.activePresetId,
        );
        if (!preset) return;
        const category = preset.categories.find((c) => c.id === categoryId);
        if (!category) return;
        category.entries.push(newEntry);
        preset.updatedAt = new Date().toISOString();
      });
      const activeId = get().activePresetId;
      debouncedSave(() => get().presets.find((p) => p.id === activeId));
    },

    async updateEntry(
      categoryId: RegexCategoryId,
      entryId: string,
      updates: Partial<RegexEntry>,
    ) {
      set((state) => {
        const preset = state.presets.find(
          (p) => p.id === state.activePresetId,
        );
        if (!preset) return;
        const category = preset.categories.find((c) => c.id === categoryId);
        if (!category) return;
        const entry = category.entries.find((e) => e.id === entryId);
        if (!entry) return;
        Object.assign(entry, updates);
        preset.updatedAt = new Date().toISOString();
      });
      const activeId = get().activePresetId;
      debouncedSave(() => get().presets.find((p) => p.id === activeId));
    },

    async removeEntry(categoryId: RegexCategoryId, entryId: string) {
      set((state) => {
        const preset = state.presets.find(
          (p) => p.id === state.activePresetId,
        );
        if (!preset) return;
        const category = preset.categories.find((c) => c.id === categoryId);
        if (!category) return;
        category.entries = category.entries.filter((e) => e.id !== entryId);
        preset.updatedAt = new Date().toISOString();
      });
      const activeId = get().activePresetId;
      debouncedSave(() => get().presets.find((p) => p.id === activeId));
    },

    async toggleEntry(categoryId: RegexCategoryId, entryId: string) {
      set((state) => {
        const preset = state.presets.find(
          (p) => p.id === state.activePresetId,
        );
        if (!preset) return;
        const category = preset.categories.find((c) => c.id === categoryId);
        if (!category) return;
        const entry = category.entries.find((e) => e.id === entryId);
        if (!entry) return;
        entry.enabled = !entry.enabled;
        preset.updatedAt = new Date().toISOString();
      });
      const activeId = get().activePresetId;
      debouncedSave(() => get().presets.find((p) => p.id === activeId));
    },

    async clearCategory(categoryId: RegexCategoryId) {
      set((state) => {
        const preset = state.presets.find(
          (p) => p.id === state.activePresetId,
        );
        if (!preset) return;
        const category = preset.categories.find((c) => c.id === categoryId);
        if (!category) return;
        category.entries = [];
        preset.updatedAt = new Date().toISOString();
      });
      const activeId = get().activePresetId;
      debouncedSave(() => get().presets.find((p) => p.id === activeId));
    },
  })),
);
