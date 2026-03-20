# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
poe-router/
├── src/
│   ├── app/                        # Next.js App Router pages and API routes
│   │   ├── layout.tsx              # Root layout — AppShell + Toaster
│   │   ├── page.tsx                # Dashboard (/)
│   │   ├── globals.css             # Tailwind base styles + CSS custom properties
│   │   ├── favicon.ico
│   │   ├── api/
│   │   │   └── pob-proxy/
│   │   │       └── route.ts        # CORS proxy for pobb.in
│   │   ├── builds/
│   │   │   ├── page.tsx            # Build list (/builds)
│   │   │   ├── import/
│   │   │   │   └── page.tsx        # Share link import (/builds/import?data=...)
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Build editor (/builds/:id)
│   │   │       └── run/
│   │   │           └── page.tsx    # Run view (/builds/:id/run)
│   │   ├── regex/
│   │   │   └── page.tsx            # Regex builder (/regex)
│   │   ├── history/
│   │   │   └── page.tsx            # Run history (/history)
│   │   └── guide/
│   │       └── page.tsx            # Guide/documentation (/guide)
│   ├── components/
│   │   ├── ui/                     # Primitive reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── CurrencyBadge.tsx
│   │   │   └── SocketColorIndicator.tsx
│   │   ├── layout/                 # App shell and navigation
│   │   │   ├── AppShell.tsx        # Root layout wrapper (sidebar + main content)
│   │   │   └── Sidebar.tsx         # Left nav with route links
│   │   ├── builds/                 # Build planning feature components
│   │   │   ├── BuildCard.tsx       # Summary card for builds list
│   │   │   ├── BuildEditor.tsx     # Advanced mode — full stop list view with DnD reorder
│   │   │   ├── BuildHeader.tsx     # Build name/class/ascendancy editor + regex generate
│   │   │   ├── StopSection.tsx     # One town stop — gem pickups + link groups
│   │   │   ├── StopHeader.tsx      # Stop label, enable toggle, custom stop controls
│   │   │   ├── PhaseEditor.tsx     # One link group phase gem slot editor
│   │   │   ├── GemPickupList.tsx   # List of gem pickups at a stop
│   │   │   ├── GemPickerDialog.tsx # Gem search/select dialog
│   │   │   ├── GemSlotCombobox.tsx # Single gem slot selector within a phase
│   │   │   ├── GearGoalsPanel.tsx  # Gear goals checklist
│   │   │   ├── MuleSection.tsx     # Mule character gem pickup panel
│   │   │   ├── InheritedLinkGroupCard.tsx  # Shows link group inherited from a prior stop
│   │   │   ├── InventoryPanel.tsx  # Accumulated gem inventory at a stop
│   │   │   ├── PobImportDialog.tsx # PoB URL import flow dialog
│   │   │   ├── RunView.tsx         # Read-only guided run view with detail levels
│   │   │   ├── TemplatePickerDialog.tsx    # Build template selection dialog
│   │   │   └── wizard/             # Step-by-step build setup wizard (default mode)
│   │   │       ├── BuildWizard.tsx         # Wizard container — step state + navigation
│   │   │       ├── WizardModeToggle.tsx    # Wizard / Advanced toggle button
│   │   │       ├── WizardProgressBar.tsx   # Step progress indicator
│   │   │       ├── WizardStepNav.tsx       # Prev/Next step navigation
│   │   │       └── steps/
│   │   │           ├── IdentityStep.tsx    # Step: class/ascendancy selection
│   │   │           ├── MuleStep.tsx        # Step: mule character setup
│   │   │           ├── StopStep.tsx        # Step: one town stop gem/link setup
│   │   │           ├── GearGoalsStep.tsx   # Step: gear goal entry
│   │   │           └── ReviewStep.tsx      # Step: summary + regex generation
│   │   ├── regex/                  # Regex builder feature components
│   │   │   ├── RegexBuilder.tsx    # Main builder container — preset management
│   │   │   ├── CategoryPanel.tsx   # One regex category (gems/links/items/etc.) panel
│   │   │   ├── ExclusionPanel.tsx  # "Don't Ever Show" item class exclusion UI
│   │   │   ├── RegexEntryRow.tsx   # One pattern entry row within a category
│   │   │   ├── RegexPreview.tsx    # Combined regex output preview + copy
│   │   │   ├── GemSearchPicker.tsx # Gem fuzzy-search picker for adding gem entries
│   │   │   └── ItemSearchPicker.tsx # Item fuzzy-search picker
│   │   ├── history/                # Run history feature components
│   │   │   ├── RunForm.tsx         # Create/edit run record form
│   │   │   ├── RunCard.tsx         # Run summary card with act splits
│   │   │   └── ActSplitTimesEditor.tsx  # Act-by-act time split entry
│   │   └── tutorial/               # Onboarding tours (driver.js based)
│   │       ├── TutorialProvider.tsx  # Context: tour completion state (localStorage)
│   │       ├── DashboardTour.tsx
│   │       ├── BuildsTour.tsx
│   │       └── BuildEditorTour.tsx
│   ├── stores/                     # Zustand state stores
│   │   ├── useBuildStore.ts        # All build plan state + mutations
│   │   ├── useRegexStore.ts        # All regex preset state + mutations
│   │   └── useRunHistoryStore.ts   # Run history state + mutations
│   ├── db/
│   │   └── database.ts             # Dexie DB class + singleton export `db`
│   ├── lib/                        # Pure business logic (no React)
│   │   ├── regex/
│   │   │   ├── abbreviator.ts      # Core: shortest unique PoE regex abbreviation engine
│   │   │   ├── combiner.ts         # Combines categories into final PoE search string
│   │   │   └── generate-from-build.ts  # Derives full regex preset from BuildPlan
│   │   ├── pob/                    # Path of Building import pipeline
│   │   │   ├── decode.ts           # Base64url + pako inflate → XML
│   │   │   ├── parse.ts            # XML → PobBuild (skill groups, sets)
│   │   │   ├── gem-matcher.ts      # PoB gem names → gems.json entries
│   │   │   └── backfill.ts         # Assigns gems to stops, builds link groups
│   │   ├── gem-availability.ts     # Which gems are obtainable at each quest stop
│   │   ├── gem-costs.ts            # Vendor gem cost calculations
│   │   ├── gem-inventory.ts        # Computes cumulative gem inventory at any stop
│   │   ├── link-group-resolver.ts  # Resolves active LinkGroupPhase at a stop
│   │   ├── bulk-buy.ts             # Bulk-buy vendor regex helpers
│   │   ├── share.ts                # Pako-compressed base64url share link encode/decode
│   │   ├── export.ts               # JSON export/import serialization
│   │   ├── migration.ts            # IndexedDB schema migration helpers
│   │   └── utils.ts                # Shared utilities (cn, parseTime, etc.)
│   ├── data/                       # Static game data (read-only at runtime)
│   │   ├── gems.json               # ~300 PoE gems { skills, supports }
│   │   ├── items.json              # Item bases by category
│   │   ├── classes.ts              # PoE classes + ascendancies + beach gem data
│   │   ├── town-stops.ts           # All campaign town stops with sortOrder + questsCompleted
│   │   ├── gem-rewards.ts          # Quest gem reward tables per class
│   │   ├── gem-descriptions.json   # Gem flavor/effect text
│   │   ├── stat-translations.json  # Stat display translation data
│   │   ├── base-item-names.json    # Item base name reference
│   │   ├── templates/              # Premade build templates
│   │   └── index.ts                # Data barrel export
│   ├── hooks/                      # Reusable React hooks
│   │   ├── useDebounce.ts
│   │   └── useCopyToClipboard.ts
│   ├── types/                      # TypeScript type definitions
│   │   ├── build.ts                # BuildPlan, StopPlan, GemPickup, LinkGroupPhase, etc.
│   │   ├── regex.ts                # RegexPreset, RegexCategory, RegexEntry, RegexCategoryId
│   │   ├── gem.ts                  # Gem, Item, GemColor, GemType, ItemCategory
│   │   └── history.ts              # RunRecord, ActSplit
│   └── styles/                     # Additional style files (if any beyond globals.css)
├── tests/                          # Vitest test files (mirror src/lib structure)
│   ├── lib/
│   │   ├── pob/                    # backfill, decode, gem-matcher, parse tests
│   │   ├── regex/                  # abbreviator, combiner, generate-from-build tests
│   │   ├── export.test.ts
│   │   ├── gem-availability.test.ts
│   │   ├── gem-costs.test.ts
│   │   ├── gem-inventory.test.ts
│   │   ├── link-group-resolver.test.ts
│   │   ├── share.test.ts
│   │   └── utils.test.ts
│   ├── data/                       # Test data classes.test.ts, town-stops.test.ts
│   └── helpers/                    # Test fixture helpers
├── scripts/                        # One-off utility scripts (tsx)
│   ├── bench-abbreviator.ts
│   ├── fetch-repoe-data.ts
│   ├── find_collisions4.ts
│   ├── scrape-gem-texts.ts
│   └── test_build2.ts
├── docs/                           # Internal documentation and screenshots
├── public/                         # Static assets served at root
├── next.config.ts                  # Next.js config (output: 'standalone')
├── tsconfig.json                   # TypeScript config (strict, path alias @/→src/)
├── vitest.config.ts                # Vitest test runner config
├── eslint.config.mjs               # ESLint config
├── postcss.config.mjs              # PostCSS / Tailwind config
└── package.json
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router routing segments — pages and the one API route
- Contains: Page components, layout, API route handler
- Key files: `layout.tsx` (root), `page.tsx` (dashboard), `builds/[id]/page.tsx` (editor), `builds/[id]/run/page.tsx` (run view)
- All page files use `'use client'` — no server components except `api/pob-proxy/route.ts`

**`src/components/`:**
- Purpose: Feature-grouped React components
- Contains: Three feature groups (`builds/`, `regex/`, `history/`) plus `ui/` primitives, `layout/`, and `tutorial/`
- Feature components are NOT generic — they import directly from stores and lib

**`src/stores/`:**
- Purpose: Application state — all three stores follow the same pattern: Zustand + Immer + Dexie with 300 ms debounced saves
- One store per domain: builds, regex presets, run history

**`src/db/`:**
- Purpose: Single Dexie database definition and singleton export
- The `db` export is used only inside stores and the dashboard import handler

**`src/lib/`:**
- Purpose: Framework-free TypeScript business logic — safe to test without React
- Two subdirectories with related groups: `regex/` (abbreviation + combination engine) and `pob/` (import pipeline)

**`src/data/`:**
- Purpose: Static game data imported as JSON or TypeScript constants
- Never written to at runtime — all user data lives in IndexedDB through stores

**`src/types/`:**
- Purpose: Shared TypeScript interfaces and factory functions
- `build.ts` also contains V1/V2 legacy type definitions for migration reference and factory functions (`createEmptyBuild`, `createEmptyPhase`, etc.)

**`tests/`:**
- Purpose: Vitest unit tests for all business logic in `src/lib/` and `src/data/`
- Structure mirrors `src/` — tests are NOT co-located with source files

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML shell, fonts, `AppShell` wrapper
- `src/app/page.tsx`: Dashboard — first page users see
- `src/app/builds/[id]/page.tsx`: Build editor with wizard/advanced mode toggle
- `src/app/builds/[id]/run/page.tsx`: Run view (read-only during-run reference)
- `src/app/api/pob-proxy/route.ts`: Only server-side code in the project

**Core State:**
- `src/stores/useBuildStore.ts`: ~600 lines, all build mutations
- `src/stores/useRegexStore.ts`: ~320 lines, all regex mutations
- `src/db/database.ts`: Dexie schema and singleton

**Core Logic:**
- `src/lib/regex/abbreviator.ts`: Most critical algorithm — shortest unique PoE pattern generator
- `src/lib/pob/backfill.ts`: PoB import end-to-end — places gems at stops, builds link groups
- `src/lib/regex/generate-from-build.ts`: Derives regex preset from a BuildPlan
- `src/lib/gem-inventory.ts`: Cumulative gem inventory at any stop (used in editor + wizard)
- `src/lib/link-group-resolver.ts`: Phase resolution — which link group setup is active at a stop

**Type Definitions:**
- `src/types/build.ts`: Primary domain types including V1/V2/V3 build shapes and factory functions
- `src/types/regex.ts`: Regex types including `DEFAULT_CATEGORIES` constant
- `src/types/gem.ts`: `Gem`, `Item`, `GemColor`, `GemType`, `ItemCategory`

**Static Game Data:**
- `src/data/town-stops.ts`: `TOWN_STOPS[]` array — all campaign stops with `sortOrder` field used throughout lib
- `src/data/gems.json`: Source of truth for all matchable gem names
- `src/data/gem-rewards.ts`: Per-class quest reward gem tables

## Naming Conventions

**Files:**
- React components: PascalCase (`BuildEditor.tsx`, `StopSection.tsx`)
- Stores: camelCase prefixed with `use` (`useBuildStore.ts`)
- Lib modules: kebab-case (`gem-inventory.ts`, `link-group-resolver.ts`)
- Data files: kebab-case (`town-stops.ts`, `gem-rewards.ts`) or lowercase JSON (`gems.json`)
- Type files: lowercase (`build.ts`, `gem.ts`, `history.ts`)
- Test files: match source name + `.test.ts` suffix (`abbreviator.test.ts`)

**Directories:**
- Feature directories: lowercase plural noun (`builds/`, `regex/`, `history/`)
- Wizard sub-feature: nested `wizard/` with `steps/` subdirectory

**Exports:**
- Components: named exports (no default component exports except page files)
- Pages: `export default function` (Next.js requirement)
- Stores: named export of the `create()` result (`export const useBuildStore`)
- Lib: named exports, no barrel files except `src/data/index.ts`

## Where to Add New Code

**New page/route:**
- Create directory under `src/app/` matching the route path
- Add `page.tsx` with `'use client'` at the top
- Add nav link to `src/components/layout/Sidebar.tsx` if it should appear in nav

**New feature component:**
- Add `.tsx` file in the relevant `src/components/<feature>/` directory
- Import store hooks and lib directly — no props-drilling pattern
- Use `clsx`/`cn` for conditional class names

**New build mutation:**
- Add action to `BuildState` interface in `src/stores/useBuildStore.ts`
- Implement using Immer `set()` then `debouncedSave()`
- No store migration needed — add optional fields to `BuildPlan` in `src/types/build.ts`

**New regex category operation:**
- Add action to `RegexState` interface in `src/stores/useRegexStore.ts`

**New lib/business logic:**
- Add `.ts` file in `src/lib/` (or `src/lib/regex/` / `src/lib/pob/` if related)
- No React imports — pure TypeScript only
- Add corresponding test in `tests/lib/`

**New static game data:**
- Add to `src/data/` as TypeScript constants or JSON
- Export from `src/data/index.ts` if broadly needed

**New type:**
- Add interface/type to the most relevant file in `src/types/`
- Add factory function in the same file if the type has required fields

**Utilities:**
- Shared helpers: `src/lib/utils.ts`
- React-specific hooks: `src/hooks/`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents
- Generated: No (manually created)
- Committed: No (`.gitignore`d via `docs/internal` gitignore rule — confirm with `.gitignore`)

**`.next/`:**
- Purpose: Next.js build output including `standalone/` bundle
- Generated: Yes (`npm run build`)
- Committed: No

**`coverage/`:**
- Purpose: Vitest test coverage reports
- Generated: Yes (`npm run coverage` or equivalent)
- Committed: No

**`scripts/`:**
- Purpose: Developer utility scripts — data fetching, collision testing, benchmarking
- Run with: `npx tsx scripts/<file>.ts`
- Committed: Yes

**`docs/`:**
- Purpose: Internal documentation and screenshots
- Committed: No (`.gitignore`d via `chore: gitignore internal docs directory` commit)

---

*Structure analysis: 2026-03-20*
