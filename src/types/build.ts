export type SocketColor = 'R' | 'G' | 'B' | 'W';

export interface GemSlot {
  gemName: string;
  socketColor: SocketColor;
  alternatives?: GemSlot[];
}

export interface GemPickup {
  id: string;
  gemName: string;
  gemColor: 'red' | 'green' | 'blue';
  source: 'quest_reward' | 'vendor';
  rewardSetId?: string;
}

export interface StopPlan {
  stopId: string;
  enabled: boolean;
  gemPickups: GemPickup[];
  notes: string;
  isCustom?: boolean;
  customLabel?: string;
  afterStopId?: string;
  droppedGems?: string[];
}

export interface GearGoal {
  id: string;
  slot: string;
  description: string;
  acquired: boolean;
  targetStopId?: string;
}

// === Build-level Link Groups with Phases ===

export interface LinkGroupPhase {
  id: string;
  fromStopId: string;
  gems: GemSlot[];
  notes?: string;
}

export interface BuildLinkGroup {
  id: string;
  label: string;
  phases: LinkGroupPhase[];
}

export interface MulePickup {
  id: string;
  gemName: string;
  gemColor: 'red' | 'green' | 'blue';
  source: 'beach' | 'quest_reward' | 'vendor';
}

export interface BuildPlan {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  regexPresetId?: string;
  stops: StopPlan[];
  linkGroups: BuildLinkGroup[];
  gearGoals: GearGoal[];
  muleClassName?: string;
  mulePickups?: MulePickup[];
  createdAt: string;
  updatedAt: string;
  version: 3;
}

// === V2 Types (for migration reference) ===

export interface LinkGroupV2 {
  id: string;
  label?: string;
  gems: GemSlot[];
  notes?: string;
}

export interface StopPlanV2 {
  stopId: string;
  enabled: boolean;
  gemPickups: GemPickup[];
  linkGroups: LinkGroupV2[];
  notes: string;
}

export interface BuildPlanV2 {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  regexPresetId?: string;
  stops: StopPlanV2[];
  gearGoals: GearGoal[];
  createdAt: string;
  updatedAt: string;
  version: 2;
}

// === V1 Types (Act-based, for migration) ===

export interface GemSetupV1 {
  id: string;
  gems: string[];
  socketColors: SocketColor[];
  notes?: string;
}

export interface SkillTransitionV1 {
  id: string;
  fromSkill: string;
  toSkill: string;
  condition: string;
}

export interface GearGoalV1 {
  id: string;
  slot: string;
  description: string;
  acquired: boolean;
}

export interface ActPlanV1 {
  actNumber: number;
  gemSetups: GemSetupV1[];
  skillTransitions: SkillTransitionV1[];
  gearGoals: GearGoalV1[];
  notes: string;
}

export interface BuildPlanV1 {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  regexPresetId?: string;
  acts: ActPlanV1[];
  createdAt: string;
  updatedAt: string;
  version?: undefined;
}

// === Factory functions ===

export function createEmptyStopPlan(stopId: string): StopPlan {
  return {
    stopId,
    enabled: true,
    gemPickups: [],
    notes: '',
  };
}

export function createEmptyPhase(fromStopId: string): LinkGroupPhase {
  return {
    id: crypto.randomUUID(),
    fromStopId,
    gems: [{ gemName: '', socketColor: 'R' }],
  };
}

export function createEmptyBuildLinkGroup(fromStopId: string): BuildLinkGroup {
  return {
    id: crypto.randomUUID(),
    label: '',
    phases: [createEmptyPhase(fromStopId)],
  };
}

export function createEmptyBuild(id: string): BuildPlan {
  return {
    id,
    name: 'New Build',
    className: '',
    ascendancy: '',
    stops: [],
    linkGroups: [],
    gearGoals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 3,
  };
}
