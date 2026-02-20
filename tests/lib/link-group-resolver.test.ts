import { describe, it, expect } from 'vitest';
import { resolvePhaseAtStop, resolveLinkGroupsAtStop, getPreviousPhase } from '@/lib/link-group-resolver';
import { makeGemSlot, makePhase, makeLinkGroup } from '../helpers/fixtures';

describe('resolvePhaseAtStop', () => {
  it('returns exact match when stop matches phase', () => {
    const lg = makeLinkGroup('Test', [
      makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]),
    ]);
    const result = resolvePhaseAtStop(lg, 'a1_after_hillock');
    expect(result).not.toBeNull();
    expect(result!.isExactMatch).toBe(true);
    expect(result!.phase.gems[0].gemName).toBe('Fireball');
  });

  it('returns latest phase before the stop', () => {
    const lg = makeLinkGroup('Test', [
      makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]),
      makePhase('a3_after_library', [makeGemSlot('Fireball', 'B'), makeGemSlot('Frostbolt', 'B')]),
    ]);
    // At a2_after_weaver, the a1_after_hillock phase should be active
    const result = resolvePhaseAtStop(lg, 'a2_after_weaver');
    expect(result).not.toBeNull();
    expect(result!.isExactMatch).toBe(false);
    expect(result!.phase.gems).toHaveLength(1);
  });

  it('returns null when before all phases', () => {
    const lg = makeLinkGroup('Test', [
      makePhase('a3_after_library', [makeGemSlot('Fireball', 'B')]),
    ]);
    const result = resolvePhaseAtStop(lg, 'a1_after_hillock');
    expect(result).toBeNull();
  });

  it('handles multi-phase selection correctly', () => {
    const lg = makeLinkGroup('Test', [
      makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]),
      makePhase('a2_after_weaver', [makeGemSlot('Fireball', 'B'), makeGemSlot('Frostbolt', 'B')]),
      makePhase('a4_after_malachai', [makeGemSlot('Fireball', 'B'), makeGemSlot('Frostbolt', 'B'), makeGemSlot('Ice Nova', 'B')]),
    ]);
    const result = resolvePhaseAtStop(lg, 'a3_after_library');
    expect(result).not.toBeNull();
    expect(result!.phase.gems).toHaveLength(2);
  });
});

describe('resolveLinkGroupsAtStop', () => {
  it('resolves multiple groups', () => {
    const groups = [
      makeLinkGroup('Group A', [makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')])]),
      makeLinkGroup('Group B', [makePhase('a1_after_hillock', [makeGemSlot('Arc', 'B')])]),
    ];
    const results = resolveLinkGroupsAtStop(groups, 'a1_after_hillock');
    expect(results).toHaveLength(2);
  });

  it('filters out not-yet-active groups', () => {
    const groups = [
      makeLinkGroup('Early', [makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')])]),
      makeLinkGroup('Late', [makePhase('a6_town_arrival', [makeGemSlot('Arc', 'B')])]),
    ];
    const results = resolveLinkGroupsAtStop(groups, 'a1_after_hillock');
    expect(results).toHaveLength(1);
    expect(results[0].buildLinkGroup.label).toBe('Early');
  });

  it('filters out retired groups (empty gems)', () => {
    const groups = [
      makeLinkGroup('Retired', [
        makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]),
        makePhase('a3_after_library', []), // retired
      ]),
    ];
    const results = resolveLinkGroupsAtStop(groups, 'a3_after_library');
    expect(results).toHaveLength(0);
  });

  it('marks isPhaseStart flag correctly', () => {
    const groups = [
      makeLinkGroup('Test', [makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')])]),
    ];
    const atStart = resolveLinkGroupsAtStop(groups, 'a1_after_hillock');
    expect(atStart[0].isPhaseStart).toBe(true);

    const later = resolveLinkGroupsAtStop(groups, 'a2_after_weaver');
    expect(later[0].isPhaseStart).toBe(false);
  });
});

describe('getPreviousPhase', () => {
  it('returns null for first phase', () => {
    const phase = makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]);
    const lg = makeLinkGroup('Test', [phase]);
    expect(getPreviousPhase(lg, phase)).toBeNull();
  });

  it('returns previous phase by stop order', () => {
    const phase1 = makePhase('a1_after_hillock', [makeGemSlot('Fireball', 'B')]);
    const phase2 = makePhase('a3_after_library', [makeGemSlot('Fireball', 'B'), makeGemSlot('Frostbolt', 'B')]);
    const lg = makeLinkGroup('Test', [phase1, phase2]);

    const prev = getPreviousPhase(lg, phase2);
    expect(prev).not.toBeNull();
    expect(prev!.fromStopId).toBe('a1_after_hillock');
  });
});
