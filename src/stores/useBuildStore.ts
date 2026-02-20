'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { db } from '@/db/database';
import type { BuildPlan, StopPlan, GemPickup, GearGoal, LinkGroupPhase, GemSlot, MulePickup } from '@/types/build';
import { createEmptyBuild, createEmptyStopPlan, createEmptyBuildLinkGroup, createEmptyPhase } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';
import { resolvePhaseAtStop } from '@/lib/link-group-resolver';

interface BuildState {
  builds: BuildPlan[];
  activeBuildId: string | null;
  isLoading: boolean;

  activeBuild: BuildPlan | null;

  // CRUD
  loadBuilds: () => Promise<void>;
  createBuild: (name?: string) => Promise<string>;
  deleteBuild: (id: string) => Promise<void>;
  duplicateBuild: (id: string) => Promise<string>;
  setActiveBuild: (id: string) => void;

  // Build-level updates
  updateBuildInfo: (id: string, updates: { name?: string; className?: string; ascendancy?: string; regexPresetId?: string }) => Promise<void>;

  // Stop initialization (called when class changes or new build created)
  initializeStops: (buildId: string) => Promise<void>;

  // Stop-level mutations
  toggleStopEnabled: (buildId: string, stopId: string) => Promise<void>;
  updateStopNotes: (buildId: string, stopId: string, notes: string) => Promise<void>;

  // Gem pickup mutations
  addGemPickup: (buildId: string, stopId: string, pickup: GemPickup) => Promise<void>;
  removeGemPickup: (buildId: string, stopId: string, pickupId: string) => Promise<void>;

  // Build-level link group mutations
  addLinkGroup: (buildId: string, fromStopId: string) => Promise<void>;
  removeLinkGroup: (buildId: string, linkGroupId: string) => Promise<void>;
  updateLinkGroupLabel: (buildId: string, linkGroupId: string, label: string) => Promise<void>;
  addPhase: (buildId: string, linkGroupId: string, fromStopId: string) => Promise<void>;
  retireLinkGroup: (buildId: string, linkGroupId: string, fromStopId: string) => Promise<void>;
  updatePhase: (buildId: string, linkGroupId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => Promise<void>;
  removePhase: (buildId: string, linkGroupId: string, phaseId: string) => Promise<void>;

  // Gear goal mutations (build-level)
  addGearGoal: (buildId: string, goal: GearGoal) => Promise<void>;
  updateGearGoal: (buildId: string, goalId: string, updates: Partial<GearGoal>) => Promise<void>;
  removeGearGoal: (buildId: string, goalId: string) => Promise<void>;
  toggleGearGoalAcquired: (buildId: string, goalId: string) => Promise<void>;

  // Custom stop mutations
  addCustomStop: (buildId: string, afterStopId: string) => Promise<void>;
  removeCustomStop: (buildId: string, stopId: string) => Promise<void>;
  updateCustomStopLabel: (buildId: string, stopId: string, label: string) => Promise<void>;

  // Reorder
  reorderGemsInPhase: (buildId: string, linkGroupId: string, phaseId: string, fromIndex: number, toIndex: number) => Promise<void>;
  reorderLinkGroups: (buildId: string, fromIndex: number, toIndex: number) => Promise<void>;

  // Import
  importBuild: (build: BuildPlan) => Promise<string>;

  // Gem drop mutations
  dropGem: (buildId: string, stopId: string, gemName: string) => Promise<void>;
  undropGem: (buildId: string, stopId: string, gemName: string) => Promise<void>;

  // Mule mutations
  updateMuleClass: (buildId: string, muleClassName: string) => Promise<void>;
  addMulePickup: (buildId: string, pickup: MulePickup) => Promise<void>;
  removeMulePickup: (buildId: string, pickupId: string) => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(getBuild: () => BuildPlan | undefined) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const build = getBuild();
    if (build) {
      db.builds.put(JSON.parse(JSON.stringify(build))).catch(console.error);
    }
  }, 300);
}

function getActiveBuild(state: { builds: BuildPlan[]; activeBuildId: string | null }): BuildPlan | null {
  if (!state.activeBuildId) return null;
  return state.builds.find((b) => b.id === state.activeBuildId) ?? null;
}

function findBuildAndStop(builds: BuildPlan[], buildId: string, stopId: string) {
  const build = builds.find((b) => b.id === buildId);
  if (!build) return null;
  const stop = build.stops.find((s) => s.stopId === stopId);
  if (!stop) return null;
  return { build, stop };
}

export const useBuildStore = create<BuildState>()(
  immer((set, get) => ({
    builds: [],
    activeBuildId: null,
    isLoading: false,

    get activeBuild() {
      return getActiveBuild(get());
    },

    async loadBuilds() {
      set((state) => {
        state.isLoading = true;
      });
      try {
        const builds = (await db.builds.toArray()) as BuildPlan[];
        set((state) => {
          state.builds = builds;
          state.isLoading = false;
          if (builds.length > 0 && !state.activeBuildId) {
            state.activeBuildId = builds[0].id;
          }
        });
      } catch (error) {
        console.error('Failed to load builds:', error);
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    async createBuild(name?: string) {
      const id = crypto.randomUUID();
      const newBuild = createEmptyBuild(id);
      if (name) newBuild.name = name;
      // Initialize with default stops
      newBuild.stops = TOWN_STOPS.map((ts) => createEmptyStopPlan(ts.id));
      for (const stop of newBuild.stops) {
        const townStop = TOWN_STOPS.find((ts) => ts.id === stop.stopId);
        if (townStop) {
          stop.enabled = townStop.defaultEnabled;
        }
      }
      await db.builds.add(newBuild);
      set((state) => {
        state.builds.push(newBuild);
        state.activeBuildId = id;
      });
      return id;
    },

    async deleteBuild(id: string) {
      await db.builds.delete(id);
      set((state) => {
        state.builds = state.builds.filter((b) => b.id !== id);
        if (state.activeBuildId === id) {
          state.activeBuildId = state.builds[0]?.id ?? null;
        }
      });
    },

    async duplicateBuild(id: string) {
      const source = get().builds.find((b) => b.id === id);
      if (!source) throw new Error(`Build ${id} not found`);

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const duplicate: BuildPlan = {
        ...JSON.parse(JSON.stringify(source)),
        id: newId,
        name: `${source.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      };
      await db.builds.add(duplicate);
      set((state) => {
        state.builds.push(duplicate);
        state.activeBuildId = newId;
      });
      return newId;
    },

    setActiveBuild(id: string) {
      set((state) => {
        state.activeBuildId = id;
      });
    },

    async updateBuildInfo(id, updates) {
      set((state) => {
        const build = state.builds.find((b) => b.id === id);
        if (!build) return;
        if (updates.name !== undefined) build.name = updates.name;
        if (updates.className !== undefined) {
          build.className = updates.className;
          if (updates.ascendancy === undefined) build.ascendancy = '';
        }
        if (updates.ascendancy !== undefined) build.ascendancy = updates.ascendancy;
        if (updates.regexPresetId !== undefined) build.regexPresetId = updates.regexPresetId;
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === id));
    },

    async initializeStops(buildId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        // Only initialize if stops are empty
        if (build.stops.length === 0) {
          build.stops = TOWN_STOPS.map((ts) => {
            const stop = createEmptyStopPlan(ts.id);
            stop.enabled = ts.defaultEnabled;
            return stop;
          });
        }
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async toggleStopEnabled(buildId, stopId) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        result.stop.enabled = !result.stop.enabled;
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async updateStopNotes(buildId, stopId, notes) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        result.stop.notes = notes;
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async addGemPickup(buildId, stopId, pickup) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        // Quest rewards: replace existing pick from the same reward set
        if (pickup.source === 'quest_reward' && pickup.rewardSetId) {
          result.stop.gemPickups = result.stop.gemPickups.filter(
            (p) => !(p.source === 'quest_reward' && p.rewardSetId === pickup.rewardSetId)
          );
        }
        result.stop.gemPickups.push(pickup);
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removeGemPickup(buildId, stopId, pickupId) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        result.stop.gemPickups = result.stop.gemPickups.filter((p) => p.id !== pickupId);
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Build-level link group mutations ===

    async addLinkGroup(buildId, fromStopId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.linkGroups.push(createEmptyBuildLinkGroup(fromStopId));
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removeLinkGroup(buildId, linkGroupId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.linkGroups = build.linkGroups.filter((lg) => lg.id !== linkGroupId);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async updateLinkGroupLabel(buildId, linkGroupId, label) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;
        lg.label = label;
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async addPhase(buildId, linkGroupId, fromStopId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;

        // Copy gems from the currently active phase at this stop
        const resolved = resolvePhaseAtStop(lg, fromStopId);
        const newPhase = createEmptyPhase(fromStopId);
        if (resolved) {
          newPhase.gems = JSON.parse(JSON.stringify(resolved.phase.gems)) as GemSlot[];
        }
        lg.phases.push(newPhase);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async retireLinkGroup(buildId, linkGroupId, fromStopId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;

        // Remove all phases at or after this stop
        const stopOrder = new Map(TOWN_STOPS.map((s) => [s.id, s.sortOrder]));
        const retireOrder = stopOrder.get(fromStopId) ?? Infinity;
        lg.phases = lg.phases.filter(
          (p) => (stopOrder.get(p.fromStopId) ?? Infinity) < retireOrder,
        );

        // Add an empty phase at this stop — resolver will see no gems and skip it
        const retirePhase = createEmptyPhase(fromStopId);
        retirePhase.gems = [];
        lg.phases.push(retirePhase);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async updatePhase(buildId, linkGroupId, phaseId, updates) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;
        const phase = lg.phases.find((p) => p.id === phaseId);
        if (!phase) return;
        if (updates.gems !== undefined) phase.gems = updates.gems;
        if (updates.notes !== undefined) phase.notes = updates.notes;
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removePhase(buildId, linkGroupId, phaseId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;

        // If this is the last phase, remove the entire group
        if (lg.phases.length <= 1) {
          build.linkGroups = build.linkGroups.filter((g) => g.id !== linkGroupId);
        } else {
          lg.phases = lg.phases.filter((p) => p.id !== phaseId);
        }
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Gear goal mutations ===

    async addGearGoal(buildId, goal) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.gearGoals.push(goal);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async updateGearGoal(buildId, goalId, updates) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const goal = build.gearGoals.find((g) => g.id === goalId);
        if (!goal) return;
        Object.assign(goal, updates);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removeGearGoal(buildId, goalId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.gearGoals = build.gearGoals.filter((g) => g.id !== goalId);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async toggleGearGoalAcquired(buildId, goalId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const goal = build.gearGoals.find((g) => g.id === goalId);
        if (!goal) return;
        goal.acquired = !goal.acquired;
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Custom stop mutations ===

    async addCustomStop(buildId, afterStopId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const newStop: StopPlan = {
          stopId: crypto.randomUUID(),
          enabled: true,
          gemPickups: [],
          notes: '',
          isCustom: true,
          customLabel: 'Custom Stop',
          afterStopId,
        };
        // Insert after the specified stop
        const idx = build.stops.findIndex((s) => s.stopId === afterStopId);
        if (idx >= 0) {
          // Insert after the last consecutive custom stop that also follows this afterStopId
          let insertIdx = idx + 1;
          while (insertIdx < build.stops.length && build.stops[insertIdx].isCustom && build.stops[insertIdx].afterStopId === afterStopId) {
            insertIdx++;
          }
          build.stops.splice(insertIdx, 0, newStop);
        } else {
          build.stops.push(newStop);
        }
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removeCustomStop(buildId, stopId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const stop = build.stops.find((s) => s.stopId === stopId);
        if (!stop?.isCustom) return;
        build.stops = build.stops.filter((s) => s.stopId !== stopId);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async updateCustomStopLabel(buildId, stopId, label) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result || !result.stop.isCustom) return;
        result.stop.customLabel = label;
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Reorder ===

    async reorderGemsInPhase(buildId, linkGroupId, phaseId, fromIndex, toIndex) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const lg = build.linkGroups.find((g) => g.id === linkGroupId);
        if (!lg) return;
        const phase = lg.phases.find((p) => p.id === phaseId);
        if (!phase) return;
        const [moved] = phase.gems.splice(fromIndex, 1);
        phase.gems.splice(toIndex, 0, moved);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async reorderLinkGroups(buildId, fromIndex, toIndex) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        const [moved] = build.linkGroups.splice(fromIndex, 1);
        build.linkGroups.splice(toIndex, 0, moved);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Import ===

    async importBuild(build: BuildPlan) {
      await db.builds.add(JSON.parse(JSON.stringify(build)));
      set((state) => {
        state.builds.push(build);
        state.activeBuildId = build.id;
      });
      return build.id;
    },

    // === Gem drop mutations ===

    async dropGem(buildId, stopId, gemName) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        if (!result.stop.droppedGems) result.stop.droppedGems = [];
        if (!result.stop.droppedGems.includes(gemName)) {
          result.stop.droppedGems.push(gemName);
        }
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async undropGem(buildId, stopId, gemName) {
      set((state) => {
        const result = findBuildAndStop(state.builds, buildId, stopId);
        if (!result) return;
        if (result.stop.droppedGems) {
          result.stop.droppedGems = result.stop.droppedGems.filter((n) => n !== gemName);
          if (result.stop.droppedGems.length === 0) {
            delete result.stop.droppedGems;
          }
        }
        result.build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    // === Mule mutations ===

    async updateMuleClass(buildId, muleClassName) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.muleClassName = muleClassName || undefined;
        if (!muleClassName) {
          build.mulePickups = [];
        }
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async addMulePickup(buildId, pickup) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        if (!build.mulePickups) build.mulePickups = [];
        build.mulePickups.push(pickup);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },

    async removeMulePickup(buildId, pickupId) {
      set((state) => {
        const build = state.builds.find((b) => b.id === buildId);
        if (!build) return;
        build.mulePickups = (build.mulePickups ?? []).filter((p) => p.id !== pickupId);
        build.updatedAt = new Date().toISOString();
      });
      debouncedSave(() => get().builds.find((b) => b.id === buildId));
    },
  })),
);
