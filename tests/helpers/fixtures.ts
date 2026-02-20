import type { GemSlot, LinkGroupPhase, BuildLinkGroup, GemPickup, StopPlan, BuildPlan, SocketColor } from '@/types/build';

export function makeGemSlot(gemName: string, socketColor: SocketColor = 'R'): GemSlot {
  return { gemName, socketColor };
}

export function makePhase(fromStopId: string, gems: GemSlot[]): LinkGroupPhase {
  return {
    id: crypto.randomUUID(),
    fromStopId,
    gems,
  };
}

export function makeLinkGroup(label: string, phases: LinkGroupPhase[]): BuildLinkGroup {
  return {
    id: crypto.randomUUID(),
    label,
    phases,
  };
}

export function makePickup(gemName: string, gemColor: 'red' | 'green' | 'blue' = 'red', source: 'quest_reward' | 'vendor' = 'vendor'): GemPickup {
  return {
    id: crypto.randomUUID(),
    gemName,
    gemColor,
    source,
  };
}

export function makeStopPlan(stopId: string, opts?: Partial<StopPlan>): StopPlan {
  return {
    stopId,
    enabled: true,
    gemPickups: [],
    notes: '',
    ...opts,
  };
}

export function makeMinimalBuild(overrides?: Partial<BuildPlan>): BuildPlan {
  return {
    id: crypto.randomUUID(),
    name: 'Test Build',
    className: 'Witch',
    ascendancy: 'Elementalist',
    stops: [],
    linkGroups: [],
    gearGoals: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 3,
    ...overrides,
  };
}
