'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { db } from '@/db/database';
import type { RunRecord } from '@/types/history';
import { parseTime } from '@/lib/utils';

interface RunHistoryState {
  runs: RunRecord[];
  isLoading: boolean;

  loadRuns: () => Promise<void>;
  createRun: (run: RunRecord) => Promise<void>;
  updateRun: (id: string, updates: Partial<RunRecord>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;

  getRunsForBuild: (buildPlanId: string) => RunRecord[];
  getPersonalBest: (buildName: string) => RunRecord | null;
}

export const useRunHistoryStore = create<RunHistoryState>()(
  immer((set, get) => ({
    runs: [],
    isLoading: false,

    loadRuns: async () => {
      set((state) => {
        state.isLoading = true;
      });
      try {
        const runs = await db.runs.orderBy('date').reverse().toArray();
        set((state) => {
          state.runs = runs;
          state.isLoading = false;
        });
      } catch {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    createRun: async (run: RunRecord) => {
      await db.runs.add(run);
      set((state) => {
        state.runs.unshift(run);
        state.runs.sort((a, b) => b.date.localeCompare(a.date));
      });
    },

    updateRun: async (id: string, updates: Partial<RunRecord>) => {
      const patched = { ...updates, updatedAt: new Date().toISOString() };
      await db.runs.update(id, patched);
      set((state) => {
        const idx = state.runs.findIndex((r) => r.id === id);
        if (idx !== -1) {
          Object.assign(state.runs[idx], patched);
          state.runs.sort((a, b) => b.date.localeCompare(a.date));
        }
      });
    },

    deleteRun: async (id: string) => {
      await db.runs.delete(id);
      set((state) => {
        state.runs = state.runs.filter((r) => r.id !== id);
      });
    },

    getRunsForBuild: (buildPlanId: string) => {
      return get().runs.filter((r) => r.buildPlanId === buildPlanId);
    },

    getPersonalBest: (buildName: string) => {
      const matching = get().runs.filter(
        (r) => r.buildName === buildName && r.totalTime
      );
      if (matching.length === 0) return null;
      return matching.reduce((best, run) =>
        parseTime(run.totalTime) < parseTime(best.totalTime) ? run : best
      );
    },
  }))
);
