import { describe, it, expect } from 'vitest';
import { getInventoryAtStop } from '@/lib/gem-inventory';
import { makeMinimalBuild, makeStopPlan, makePickup } from '../helpers/fixtures';
import { TOWN_STOPS } from '@/data/town-stops';

describe('getInventoryAtStop', () => {
  it('includes beach gems at all stops', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      stops: TOWN_STOPS.map((s) => makeStopPlan(s.id)),
    });
    const inv = getInventoryAtStop(build, 'a1_after_hillock');
    expect(inv.has('Fireball')).toBe(true);
    expect(inv.has('Arcane Surge Support')).toBe(true);
  });

  it('accumulates gem pickups from earlier stops', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      stops: [
        makeStopPlan('a1_after_hillock', { gemPickups: [makePickup('Frostbolt', 'blue')] }),
        makeStopPlan('a1_after_hailrake', { gemPickups: [makePickup('Freezing Pulse', 'blue')] }),
        makeStopPlan('a1_after_brutus'),
      ],
    });
    const inv = getInventoryAtStop(build, 'a1_after_brutus');
    expect(inv.has('Frostbolt')).toBe(true);
    expect(inv.has('Freezing Pulse')).toBe(true);
  });

  it('includes target stop own pickups', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      stops: [
        makeStopPlan('a1_after_hillock', { gemPickups: [makePickup('Frostbolt', 'blue')] }),
      ],
    });
    const inv = getInventoryAtStop(build, 'a1_after_hillock');
    expect(inv.has('Frostbolt')).toBe(true);
  });

  it('excludes later stop pickups', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      stops: [
        makeStopPlan('a1_after_hillock'),
        makeStopPlan('a1_after_brutus', { gemPickups: [makePickup('Frostbolt', 'blue')] }),
      ],
    });
    const inv = getInventoryAtStop(build, 'a1_after_hillock');
    expect(inv.has('Frostbolt')).toBe(false);
  });

  it('skips disabled stops', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      stops: [
        makeStopPlan('a1_after_hillock', { enabled: false, gemPickups: [makePickup('Frostbolt', 'blue')] }),
        makeStopPlan('a1_after_brutus'),
      ],
    });
    const inv = getInventoryAtStop(build, 'a1_after_brutus');
    expect(inv.has('Frostbolt')).toBe(false);
  });

  it('includes mule beach gems when muleClassName set', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      muleClassName: 'Marauder',
      stops: [makeStopPlan('a1_after_hillock')],
    });
    const inv = getInventoryAtStop(build, 'a1_after_hillock');
    // Witch beach gems
    expect(inv.has('Fireball')).toBe(true);
    // Marauder mule beach gems
    expect(inv.has('Heavy Strike')).toBe(true);
    expect(inv.has('Ruthless Support')).toBe(true);
  });

  it('includes mule pickups', () => {
    const build = makeMinimalBuild({
      className: 'Witch',
      mulePickups: [{ id: '1', gemName: 'Cleave', gemColor: 'red', source: 'vendor' }],
      stops: [makeStopPlan('a1_after_hillock')],
    });
    const inv = getInventoryAtStop(build, 'a1_after_hillock');
    expect(inv.has('Cleave')).toBe(true);
  });
});
