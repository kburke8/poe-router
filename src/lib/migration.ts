import type { BuildPlanV2, BuildPlanV1, StopPlanV2, GearGoal, LinkGroupV2 } from '@/types/build';
import { TOWN_STOPS } from '@/data/town-stops';

/**
 * Migrate a V1 (act-based) build to V2 (stop-based).
 * Maps old ActPlan gem setups to link groups at the first stop of each act.
 * Gear goals are promoted from per-act to build-level.
 * Skill transitions are dropped (replaced by the stop-based workflow).
 */
export function migrateBuildV1toV2(v1: BuildPlanV1): BuildPlanV2 {
  // Collect all gear goals from all acts into build-level
  const gearGoals: GearGoal[] = [];
  for (const act of v1.acts) {
    for (const goal of act.gearGoals) {
      gearGoals.push({
        id: goal.id,
        slot: goal.slot,
        description: goal.description,
        acquired: goal.acquired,
      });
    }
  }

  // Create stop plans - map act data to the first stop of each act
  const stops: StopPlanV2[] = TOWN_STOPS.map((townStop) => {
    const actPlan = v1.acts.find((a) => a.actNumber === townStop.actNumber);

    // Only populate the first stop of each act with the old act data
    const isFirstStopOfAct = TOWN_STOPS.filter((s) => s.actNumber === townStop.actNumber)[0]?.id === townStop.id;

    const linkGroups: LinkGroupV2[] = [];
    if (actPlan && isFirstStopOfAct) {
      for (const setup of actPlan.gemSetups) {
        linkGroups.push({
          id: setup.id,
          label: setup.notes || '',
          gems: setup.socketColors.map((color, i) => ({
            gemName: setup.gems[i] || '',
            socketColor: color,
          })),
          notes: '',
        });
      }
    }

    return {
      stopId: townStop.id,
      enabled: townStop.defaultEnabled,
      gemPickups: [],
      linkGroups,
      notes: actPlan && isFirstStopOfAct ? actPlan.notes : '',
    };
  });

  return {
    id: v1.id,
    name: v1.name,
    className: v1.className,
    ascendancy: v1.ascendancy,
    regexPresetId: v1.regexPresetId,
    stops,
    gearGoals,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,
    version: 2,
  };
}
