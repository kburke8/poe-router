# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- React components: PascalCase matching the exported component name (`BuildEditor.tsx`, `StopSection.tsx`, `GemPickupList.tsx`)
- Hooks: camelCase prefixed with `use` (`useDebounce.ts`, `useBuildStore.ts`)
- Stores: camelCase prefixed with `use`, suffixed with `Store` (`useBuildStore.ts`, `useRegexStore.ts`, `useRunHistoryStore.ts`)
- Lib utilities: camelCase describing purpose (`gem-inventory.ts`, `link-group-resolver.ts`, `abbreviator.ts`)
- Type files: singular noun describing the domain (`build.ts`, `regex.ts`, `gem.ts`, `history.ts`)
- Data files: plural or descriptive (`gems.json`, `classes.ts`, `town-stops.ts`)

**Functions:**
- Named exports for all library functions: `export function getInventoryAtStop(...)`, `export function abbreviate(...)`
- Named exports for all components (no default exports in `src/components/`): `export function StopSection(...)`, `export function Button(...)`
- Default exports only for Next.js App Router page files: `export default function BuildsPage()`
- Factory/creator functions prefixed with `create`: `createEmptyBuild`, `createEmptyStopPlan`, `createEmptyPhase`
- Boolean-returning functions prefixed with `is`/`has`: `isGemAvailable`
- Getter functions prefixed with `get`: `getInventoryAtStop`, `getBeachGems`, `getActNumbers`
- Toggle actions prefixed with `toggle`: `toggleStopEnabled`, `toggleEntry`, `toggleBulkBuyRegex`

**Variables:**
- camelCase throughout: `buildId`, `stopPlan`, `linkGroups`, `activePresetId`
- Module-level constants: SCREAMING_SNAKE_CASE (`TOWN_STOPS`, `POE_ITEM_TEXT_SAMPLES`, `SOCKET_CYCLE`, `FIRST_STOP_ID`)
- Type aliases: PascalCase (`SocketColor`, `ButtonVariant`, `ButtonSize`)

**Types/Interfaces:**
- Interfaces for object shapes: `interface BuildPlan`, `interface StopPlan`, `interface RegexEntry`
- Type aliases for unions/primitives: `type SocketColor = 'R' | 'G' | 'B' | 'W'`, `type RegexCategoryId = 'gems' | 'links' | ...`
- Props interfaces named `[ComponentName]Props`: `interface StopSectionProps`, `interface PhaseEditorProps`
- Versioned type variants use suffix: `BuildPlanV1`, `BuildPlanV2`, `StopPlanV2`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is enforced by ESLint (`eslint.config.mjs`)
- Single quotes for strings
- Trailing commas in multi-line structures
- 2-space indentation

**Linting:**
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config: `eslint.config.mjs` (flat config format)
- Run: `npm run lint`

## Import Organization

**Order (observed pattern):**
1. React and Next.js imports (`react`, `next/link`, `next/font/google`)
2. Third-party library imports (`@dnd-kit/core`, `@radix-ui/react-collapsible`, `lucide-react`)
3. Internal stores (`@/stores/useBuildStore`)
4. Internal components (`@/components/builds/BuildHeader`)
5. Internal lib functions (`@/lib/link-group-resolver`)
6. Internal data (`@/data/town-stops`)
7. Type-only imports (`import type { BuildPlan } from '@/types/build'`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json` and `vitest.config.ts`)
- Same-directory sibling imports use relative paths: `import { CategoryPanel } from './CategoryPanel'`
- Cross-directory imports always use `@/` alias

**Type imports:**
- `import type` used for type-only imports: `import type { BuildPlan } from '@/types/build'`
- Mixed type/value imports use regular import: `import { TOWN_STOPS, type TownStop } from '@/data/town-stops'`

## Component Patterns

**Structure:**
- All components are functional — no class components
- `'use client'` directive at top of every component file (all components are client components)
- Props destructured directly in function signature
- Props interface defined immediately before component function

```typescript
// Pattern from src/components/builds/StopSection.tsx
interface StopSectionProps {
  stopPlan: StopPlan;
  buildId: string;
  onToggleEnabled: () => void;
  onAddGemPickup: (pickup: GemPickup) => void;
}

export function StopSection({
  stopPlan,
  buildId,
  onToggleEnabled,
  onAddGemPickup,
}: StopSectionProps) {
  // ...
}
```

**UI primitive components** (`src/components/ui/`) use `forwardRef` and `displayName`:
```typescript
// Pattern from src/components/ui/Button.tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return <button ref={ref} className={cn(...)} {...props} />;
  }
);
Button.displayName = 'Button';
```

**Computed values** use `useMemo` with explicit dependencies:
```typescript
const rewardPickers = useMemo(
  () => getRewardPickersAtStop(stopId, className, disabledStopIds),
  [stopId, className, disabledStopIds]
);
```

**Helper sub-components** are defined in the same file when tightly coupled and not reused:
```typescript
// Pattern from src/components/builds/BuildEditor.tsx
function SortableLinkGroupItem({ id, linkGroup }: { id: string; linkGroup: BuildLinkGroup }) { ... }
function LinkGroupReorder({ buildId, linkGroups }: { ... }) { ... }
export function BuildEditor(...) { ... }  // main export at end
```

**Event handlers** defined as `function` declarations (not arrow const) within component body when complex; inline arrows for simple cases.

## State Management Patterns

**Zustand + Immer setup:**
```typescript
// Pattern from src/stores/useBuildStore.ts
export const useBuildStore = create<BuildState>()(
  immer((set, get) => ({
    builds: [],
    activeBuildId: null,

    async createBuild(name?: string) {
      // ... await db operation ...
      set((state) => {
        state.builds.push(newBuild);  // Immer allows direct mutation
        state.activeBuildId = id;
      });
      return id;
    },
  }))
);
```

**Store conventions:**
- State interface defined as `interface [Domain]State` above `create` call
- Actions are async when they touch IndexedDB; synchronous when only updating in-memory state
- Derived/computed state implemented as getter properties on the state object (`get activeBuild()`)
- Each store has a module-level debounce timer for IndexedDB persistence (300ms)
- Deep cloning before Dexie puts: `db.builds.put(JSON.parse(JSON.stringify(build)))`

**Debounced persistence pattern:**
```typescript
// Pattern repeated in every store
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
```

**Store consumption in components:** destructure only needed actions/state from the store hook.

## TypeScript Patterns

**Strict mode:** `"strict": true` in `tsconfig.json` (all strict checks enabled)

**Discriminated unions** for result types:
```typescript
// Pattern from src/lib/pob/gem-matcher.ts (inferred from test)
type MatchResult =
  | { status: 'matched'; gem: Gem }
  | { status: 'skipped'; reason: string }
  | { status: 'not_found' }
```

**Versioned types** for migration safety — types for each schema version are kept in `src/types/build.ts` (`BuildPlanV1`, `BuildPlanV2`, current `BuildPlan` at version 3)

**Literal version field** on record types: `version: 3` (not `version: number`) enables discriminated union migrations

**`Partial<Pick<T, K>>`** pattern for partial updates:
```typescript
onUpdatePhase: (lgId: string, phaseId: string, updates: Partial<Pick<LinkGroupPhase, 'gems' | 'notes'>>) => void;
```

**`Omit<T, K>`** for creation payloads (strip auto-generated fields):
```typescript
addEntry: (categoryId: RegexCategoryId, entry: Omit<RegexEntry, 'id'>) => Promise<void>;
```

**Type assertions** used sparingly and only when necessary: `gem?.color as 'red' | 'green' | 'blue'`

**Non-null assertion (`!`)** used when type system cannot infer: `hillock!.gemPickups`

**`Record<K, V>`** for lookup tables with exhaustive keys:
```typescript
const variantStyles: Record<ButtonVariant, string> = { primary: '...', secondary: '...', ... };
```

## CSS/Styling Patterns

**Tailwind CSS v4** with a custom PoE dark theme defined in `src/app/globals.css`:
```css
@theme {
  --color-poe-bg: #1a1a2e;
  --color-poe-card: #16213e;
  --color-poe-gold: #c7a44a;
  --color-poe-red: #c53030;
  --color-poe-border: #2d3748;
  --color-poe-text: #e2e8f0;
  --color-poe-muted: #94a3b8;
}
```

**Custom color tokens** used directly as Tailwind utilities: `bg-poe-bg`, `text-poe-gold`, `border-poe-border`, `text-poe-muted`

**`cn()` utility** (re-export of `clsx`) for conditional class merging — defined in `src/lib/utils.ts`:
```typescript
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

**Opacity modifiers** for state variants: `bg-poe-gold/90` (hover), `border-poe-border/40` (subtle borders), `text-poe-muted/50` (dimmed)

**Layout patterns:**
- `flex items-center gap-{n}` for horizontal arrangements
- `space-y-{n}` for vertical stacks
- `rounded-md`, `rounded border` for cards/containers
- Sizing: `text-xs`, `text-sm`, `text-base` with Tailwind size tokens

**No CSS modules** — all styling via Tailwind utility classes in JSX className props.

## Utility Patterns

**`cn()` for classnames:** always use `cn()` over string concatenation or template literals for conditional classes.

**`crypto.randomUUID()`** for all ID generation (available natively in modern browsers/Node):
```typescript
export function generateId(): string {
  return crypto.randomUUID();
}
// Also called directly: id: crypto.randomUUID()
```

**Dates:** stored and passed as ISO 8601 strings (`new Date().toISOString()`), never as `Date` objects in persisted data.

**JSDoc comments** on complex library functions and data structures:
```typescript
/**
 * Returns the set of gem names "in inventory" at a given stop.
 * Walks all enabled stops up to and including `stopId`...
 */
export function getInventoryAtStop(build: BuildPlan, stopId: string): Set<string>
```

## Error Handling

**Library functions** throw descriptive `Error` instances with context:
```typescript
throw new Error('Invalid PoB XML: ' + parseError.textContent);
throw new Error('Invalid import file: expected a JSON object');
throw new Error(`Unsupported export version: ${data.version}. Expected version 1.`);
```

**Store async actions** catch errors and log with `console.error`:
```typescript
db.builds.put(JSON.parse(JSON.stringify(build))).catch(console.error);
```

**User-facing errors** shown via Sonner toast notifications:
```typescript
toast.success(`Imported "${payload.build.name}"`);
toast.error('Failed to import build');
```

**No global error boundaries** detected — errors propagate to Next.js defaults.

**Validation pattern:** parse-and-throw in data ingestion functions (`parseImportFile`), not pre-check guards.

## Module Design

**Exports:** named exports everywhere except Next.js App Router pages (which require default exports)

**No barrel files (`index.ts`)** — imports reference the specific file path directly

**Co-location:** sub-components used only within one component file are defined in that same file (not extracted to separate files unless reused)

---

*Convention analysis: 2026-03-20*
