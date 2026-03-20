# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Vitest 4.x
- Config: `vitest.config.ts` at project root

**Assertion Library:**
- Vitest built-in (`expect`) — no separate assertion library

**Coverage:**
- `@vitest/coverage-v8` provider
- Coverage directory: `coverage/` (contains `coverage-final.json`, `index.html`, clover XML)
- No enforced threshold configured

**Run Commands:**
```bash
npm test                  # Run all tests once (vitest run)
npm run test:watch        # Watch mode (vitest)
npm run test:coverage     # Run with coverage (vitest run --coverage)
```

## Test File Organization

**Location:** All tests in a top-level `tests/` directory, separate from `src/`. Tests mirror the `src/lib/` and `src/data/` structure.

**Directory structure:**
```
tests/
├── helpers/
│   └── fixtures.ts          # Shared factory functions for test data
├── data/
│   ├── classes.test.ts       # Tests for src/data/classes.ts
│   └── town-stops.test.ts    # Tests for src/data/town-stops.ts
└── lib/
    ├── export.test.ts
    ├── gem-availability.test.ts
    ├── gem-costs.test.ts
    ├── gem-inventory.test.ts
    ├── link-group-resolver.test.ts
    ├── share.test.ts
    ├── utils.test.ts
    ├── pob/
    │   ├── backfill.test.ts
    │   ├── decode.test.ts
    │   ├── gem-matcher.test.ts
    │   └── parse.test.ts
    └── regex/
        ├── abbreviator.test.ts
        ├── combiner.test.ts
        └── generate-from-build.test.ts
```

**Naming convention:** `{module-name}.test.ts` — matches the source filename exactly, placed in the parallel `tests/` path.

**Vitest include pattern:** `tests/**/*.test.ts` (set in `vitest.config.ts`)

**No component tests:** Only pure library functions and data utilities are tested. React components have no test coverage.

## Test Structure

**Suite Organization:**
```typescript
// Standard pattern: one describe block per exported function
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '@/lib/some-module';

describe('functionUnderTest', () => {
  it('describes expected behavior in plain English', () => {
    const result = functionUnderTest(input);
    expect(result).toBe(expected);
  });
});
```

**Multiple describe blocks per file** when a file exports multiple functions:
```typescript
// From tests/lib/utils.test.ts
describe('formatTime', () => { ... });
describe('parseTime', () => { ... });
describe('round-trip', () => { ... });  // integration between the two
```

**Test naming:** Descriptive sentences starting with a verb — "returns empty for empty input", "skips disabled entries", "throws for invalid JSON".

**Setup/Teardown:** No `beforeEach`/`afterEach` observed. Tests are fully self-contained. No shared mutable state between tests.

**Environment:** Default is `node` (set in `vitest.config.ts`). DOM tests opt in per-file with a directive comment:
```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parsePobXml } from '@/lib/pob/parse';
```
Only `tests/lib/pob/parse.test.ts` uses jsdom (because `parsePobXml` uses `DOMParser`).

## Mocking

**No mocking framework usage detected.** Tests exercise real implementations against real data (e.g., `gems.json`, `town-stops.ts`).

**What is not mocked:**
- `@/data/gems.json` — imported and used directly in tests
- `@/data/town-stops.ts` (`TOWN_STOPS`) — used directly in inventory tests
- `@/data/classes.ts` — used directly in gem-inventory tests
- IndexedDB (Dexie) — store tests do not exist; the layer is never tested directly

**Consequence:** Tests are integration-style for domain logic — they test the full chain from input data through business logic to output, without any isolation via mocks.

## Fixtures and Factories

All shared test data construction is centralized in `tests/helpers/fixtures.ts`. Factory functions follow the `make*` prefix convention and accept optional overrides:

```typescript
// From tests/helpers/fixtures.ts
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

export function makeStopPlan(stopId: string, opts?: Partial<StopPlan>): StopPlan {
  return {
    stopId,
    enabled: true,
    gemPickups: [],
    notes: '',
    ...opts,
  };
}

export function makePickup(gemName: string, gemColor: 'red' | 'green' | 'blue' = 'red', source: 'quest_reward' | 'vendor' = 'vendor'): GemPickup {
  return { id: crypto.randomUUID(), gemName, gemColor, source };
}

export function makeGemSlot(gemName: string, socketColor: SocketColor = 'R'): GemSlot
export function makePhase(fromStopId: string, gems: GemSlot[]): LinkGroupPhase
export function makeLinkGroup(label: string, phases: LinkGroupPhase[]): BuildLinkGroup
```

**Local factory functions** are also defined within individual test files for types specific to that module:
```typescript
// From tests/lib/pob/backfill.test.ts
function makePobBuild(overrides?: Partial<PobBuild>): PobBuild {
  return { className: 'Witch', ascClassName: 'Elementalist', skillGroups: [], ... , ...overrides };
}

// From tests/lib/regex/combiner.test.ts
function makeEntry(pattern: string, opts?: Partial<RegexEntry>): RegexEntry { ... }
function makeCategory(id: string, entries: RegexEntry[]): RegexCategory { ... }
```

**Convention:** Fixtures use fixed timestamps (`'2024-01-01T00:00:00.000Z'`) and predictable defaults to keep tests deterministic. IDs use `crypto.randomUUID()` (available in Node 19+).

## Coverage

**Requirements:** None enforced — no thresholds in `vitest.config.ts`.

**View Coverage:**
```bash
npm run test:coverage    # Generates coverage/ directory with HTML report
```

**Coverage scope:** Only `src/lib/` and `src/data/` are meaningfully covered. React components (`src/components/`) and stores (`src/stores/`) have no test coverage.

## Test Types

**Unit Tests:**
- Pure function tests for `src/lib/` utilities
- Each function tested in isolation with direct inputs/outputs
- Examples: `tests/lib/utils.test.ts`, `tests/lib/gem-costs.test.ts`

**Integration Tests (data-driven):**
- Tests that combine multiple modules or use real production data files
- Examples: `tests/lib/gem-inventory.test.ts` (uses real `TOWN_STOPS` + real class data), `tests/lib/regex/abbreviator.test.ts` (uses full `gems.json` pool)
- `tests/lib/pob/backfill.test.ts` exercises the full PoB import pipeline against real gem/stop data

**E2E Tests:** Not used.

**Component Tests:** Not used.

## Common Patterns

**Discriminated union narrowing in assertions:**
```typescript
// From tests/lib/pob/gem-matcher.test.ts
it('matches exact gem name', () => {
  const result = matchPobGem({ nameSpec: 'Fireball', enabled: true });
  expect(result.status).toBe('matched');
  if (result.status === 'matched') {
    expect(result.gem.name).toBe('Fireball');
  }
});
```

**Error testing with `toThrow`:**
```typescript
// From tests/lib/export.test.ts
it('throws for null', () => {
  expect(() => parseImportFile('null')).toThrow('expected a JSON object');
});
```

**Boolean membership testing:**
```typescript
// Checking Set membership
const inv = getInventoryAtStop(build, 'a1_after_hillock');
expect(inv.has('Fireball')).toBe(true);
expect(inv.has('Frostbolt')).toBe(false);
```

**Regex pattern validation:**
```typescript
// From tests/lib/regex/abbreviator.test.ts
it('pattern matches the target name', () => {
  const pattern = abbreviate('Fireball', allGemNames);
  const re = new RegExp(pattern, 'i');
  expect(re.test('Fireball')).toBe(true);
});
```

**Loop-based exhaustive testing:**
```typescript
// From tests/lib/regex/abbreviator.test.ts
it('all gems produce valid abbreviations', () => {
  for (const name of allGemNames.slice(0, 20)) {
    const pattern = abbreviate(name, allGemNames);
    const re = new RegExp(pattern, 'i');
    expect(re.test(name)).toBe(true);
  }
});
```

**Flexible assertions** when exact values depend on data:
```typescript
// From tests/lib/gem-costs.test.ts
it('aggregates costs by currency', () => {
  const costs = summarizeVendorCosts(pickups, 'Witch');
  expect(costs.length).toBeGreaterThanOrEqual(1);
  for (const c of costs) {
    expect(c.count).toBeGreaterThan(0);
  }
});
```

**Round-trip tests** for encode/decode functions:
```typescript
// From tests/lib/share.test.ts
it('round-trip preserves build data', () => {
  const build = makeMinimalBuild({ name: 'Round Trip Test' });
  const encoded = encodeBuild(build);
  const decoded = decodeBuild(encoded);
  expect(decoded.build.id).toBe(build.id);
  expect(decoded.build.name).toBe('Round Trip Test');
});
```

**Data integrity tests** verify static data files are well-formed:
```typescript
// From tests/data/classes.test.ts
describe('data integrity', () => {
  it('has exactly 7 classes', () => {
    expect(POE_CLASSES).toHaveLength(7);
  });
  it('all classes have non-empty beachGems', () => {
    for (const cls of POE_CLASSES) {
      expect(cls.beachGems.skillGem).toBeTruthy();
    }
  });
});
```

---

*Testing analysis: 2026-03-20*
