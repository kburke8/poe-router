# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Client-side Single-Page Application with Next.js App Router shell

**Key Characteristics:**
- All data lives in the browser (IndexedDB via Dexie). No backend database. No user accounts.
- Three independent Zustand stores manage all application state; pages load their required stores on mount.
- Business logic is pure TypeScript in `src/lib/` — no framework coupling. Components consume stores and call lib functions.
- One server-side API route exists solely as a CORS proxy for the external pobb.in service (`src/app/api/pob-proxy/route.ts`).
- Next.js is used only for routing and standalone build output; the app has no server-rendered pages (all pages have `'use client'`).

## Layers

**Persistence Layer:**
- Purpose: IndexedDB storage, single source of truth for all user data
- Location: `src/db/database.ts`
- Contains: Dexie `PoeDatabase` class with tables `regexPresets`, `builds`, `runs`, `customGems`, `customItems`
- Depends on: Type definitions from `src/types/`
- Used by: Zustand stores only

**State Layer (Stores):**
- Purpose: In-memory application state with optimistic mutations and debounced persistence
- Location: `src/stores/`
- Contains:
  - `useBuildStore.ts` — all `BuildPlan` CRUD plus stop/gem/link-group/gear-goal mutations
  - `useRegexStore.ts` — all `RegexPreset` CRUD plus entry/category mutations
  - `useRunHistoryStore.ts` — run record CRUD plus query helpers
- Depends on: `src/db/database.ts`, `src/types/`, `src/data/town-stops.ts`, `src/lib/link-group-resolver.ts`
- Used by: Pages and components
- Pattern: All mutations call `set()` with Immer draft, then `debouncedSave()` (300 ms) to Dexie. Reads go through Dexie on initial `load*()` call.

**Business Logic Layer:**
- Purpose: Domain computations that have no UI dependency
- Location: `src/lib/`
- Contains:
  - `src/lib/regex/abbreviator.ts` — shortest-unique-pattern engine
  - `src/lib/regex/combiner.ts` — combines categories into PoE stash filter string
  - `src/lib/regex/generate-from-build.ts` — derives regex preset from a `BuildPlan`
  - `src/lib/pob/decode.ts`, `parse.ts`, `gem-matcher.ts`, `backfill.ts` — full PoB import pipeline
  - `src/lib/gem-inventory.ts` — computes gem inventory at any campaign stop
  - `src/lib/link-group-resolver.ts` — resolves which `LinkGroupPhase` is active at a stop
  - `src/lib/gem-availability.ts` — which gems are obtainable at each quest stop
  - `src/lib/gem-costs.ts` — vendor gem cost calculations
  - `src/lib/bulk-buy.ts` — bulk-buy regex generation helpers
  - `src/lib/share.ts` — pako-compressed base64url encode/decode for share links
  - `src/lib/export.ts` — JSON import/export serialization
  - `src/lib/migration.ts` — IndexedDB schema migration helpers
- Depends on: `src/types/`, `src/data/`
- Used by: Stores, components, and pages

**Static Data Layer:**
- Purpose: Read-only game data constants, never mutated at runtime
- Location: `src/data/`
- Contains:
  - `gems.json` — ~300 PoE gems `{ skills: Gem[], supports: Gem[] }`
  - `items.json` — item bases by category
  - `classes.ts` — PoE classes, ascendancies, beach-gem starting gear
  - `town-stops.ts` — all campaign town stops with quest completion state and sort orders
  - `gem-rewards.ts` — quest reward gem availability tables per class
  - `gem-descriptions.json`, `stat-translations.json`, `base-item-names.json` — reference data
  - `templates/` — premade build templates
- Depends on: `src/types/gem.ts`
- Used by: Business logic layer, stores, components

**UI / Component Layer:**
- Purpose: React components that render state and dispatch store actions
- Location: `src/components/`
- Contains: Feature components grouped by domain (`builds/`, `regex/`, `history/`, `layout/`, `tutorial/`) plus primitives in `ui/`
- Depends on: Stores, business logic lib, types, data
- Used by: App pages

**Routing / Page Layer:**
- Purpose: Next.js App Router pages, URL-based feature entry points
- Location: `src/app/`
- Contains: Page components that wire up stores → feature components
- Depends on: Components, stores, lib utilities
- Used by: Next.js router

## Data Flow

**Typical Read Flow (e.g., Build Editor page):**

1. `src/app/builds/[id]/page.tsx` mounts, calls `useBuildStore`
2. If `builds` array is empty, `loadBuilds()` fetches from `db.builds.toArray()`
3. Dexie reads IndexedDB and returns `BuildPlan[]` into store state
4. `BuildEditor` or `BuildWizard` receives `buildId`, reads the matching build from store
5. `StopSection` calls `resolveLinkGroupsAtStop()` and `getInventoryAtStop()` from lib — pure computations over store data

**Typical Write Flow (e.g., adding a gem pickup):**

1. Component calls `useBuildStore().addGemPickup(buildId, stopId, pickup)`
2. Store's Immer `set()` mutates in-memory state immediately (optimistic)
3. `debouncedSave()` fires after 300 ms, calling `db.builds.put(build)` to persist

**PoB Import Pipeline:**

1. User pastes pobb.in URL → `PobImportDialog` calls `/api/pob-proxy?id=<id>` (server route)
2. Server fetches `https://pobb.in/<id>/raw`, returns raw export code as JSON
3. `decode.ts`: base64url decode → pako inflate → XML string
4. `parse.ts`: DOMParser extracts `PobBuild` (class, skill groups, skill sets)
5. `gem-matcher.ts`: maps PoB `nameSpec` strings to `gems.json` entries
6. `backfill.ts`: places gem pickups at earliest available campaign stops, builds link group phases
7. Result `BackfillResult` returned to page, page calls `importBuild()` on store

**Regex Generation from Build:**

1. `generateBuildRegex()` in `src/lib/regex/generate-from-build.ts` takes `BuildPlan` + store action callbacks
2. Collects vendor gem names from `build.stops[].gemPickups`
3. Calls `computeAbbreviations()` from `abbreviator.ts` for each gem name
4. Calls `generateLinkPatterns()` for socket color patterns
5. Calls `generateGambasEntries()` / `generateExcludedClassIds()` for item/exclusion suggestions
6. Injects all entries into `useRegexStore` via the passed-in action callbacks
7. `combineCategories()` from `combiner.ts` merges all categories into final PoE search string

**State Management — Derived Values:**

- `useRegexStore.activePreset` and `combinedRegex` are Zustand getter properties (computed on every `get()` call, not cached)
- `useBuildStore.activeBuild` is similarly a getter over `builds` + `activeBuildId`

## Key Abstractions

**`BuildPlan` (version 3):**
- Purpose: Complete description of one planned speed run character
- Definition: `src/types/build.ts`
- Shape: `{ stops: StopPlan[], linkGroups: BuildLinkGroup[], gearGoals: GearGoal[], mulePickups?: MulePickup[], ... }`
- `BuildLinkGroup` contains `phases: LinkGroupPhase[]` — each phase is the gem setup active from a given stop onwards

**`TownStop` / `StopPlan`:**
- `TownStop` (from `src/data/town-stops.ts`): static game data — a point in the campaign with a `sortOrder` and `questsCompleted[]`
- `StopPlan` (from `src/types/build.ts`): user data for a stop — gem pickups, enabled state, notes, optionally dropped gems

**`RegexPreset`:**
- Purpose: Named collection of regex category entries that produces a PoE stash search filter
- Definition: `src/types/regex.ts`
- Shape: `{ categories: RegexCategory[], strictLinks?, useCustomRegex?, customRegex? }`
- Six fixed `RegexCategoryId` values: `gems`, `links`, `stats`, `items`, `item_gambas`, `dont_ever_show`

**`LinkGroupPhase` resolution:**
- `resolvePhaseAtStop(lg, stopId)` in `src/lib/link-group-resolver.ts` — finds the latest phase whose `fromStopId` sortOrder is ≤ the target stop's sortOrder
- This allows link groups to evolve as the campaign progresses without storing per-stop snapshots

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Wraps all pages in `AppShell` (which wraps in `TutorialProvider`), mounts `Toaster`

**Dashboard:**
- Location: `src/app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Loads `useRegexStore` and `useBuildStore`, shows recent builds/regex summary, handles full import/export

**Builds List:**
- Location: `src/app/builds/page.tsx`
- Triggers: Navigation to `/builds`
- Responsibilities: Loads `useBuildStore`, lists all builds, handles new/PoB-import/JSON-import

**Build Editor:**
- Location: `src/app/builds/[id]/page.tsx`
- Triggers: Navigation to `/builds/:id`
- Responsibilities: Renders `BuildWizard` (default) or `BuildEditor` (advanced mode) based on `?mode=` param

**Run View:**
- Location: `src/app/builds/[id]/run/page.tsx`
- Triggers: Navigation to `/builds/:id/run`
- Responsibilities: Read-only guided playthrough view of a build — main during-run reference

**Regex Builder:**
- Location: `src/app/regex/page.tsx`
- Triggers: Navigation to `/regex`
- Responsibilities: Renders `RegexBuilder` component

**PoB Proxy API:**
- Location: `src/app/api/pob-proxy/route.ts`
- Triggers: `GET /api/pob-proxy?id=<pobb.in-id>`
- Responsibilities: CORS bypass — server fetches `https://pobb.in/<id>/raw`, returns `{ code }` JSON

**Share Import:**
- Location: `src/app/builds/import/page.tsx`
- Triggers: Navigation to `/builds/import?data=<encoded>`
- Responsibilities: Decodes pako-compressed share payload, previews build, imports to local store

## Error Handling

**Strategy:** Optimistic UI with `try/catch` at page-level async handlers; store load failures are silenced (logged to console); user feedback via Sonner toasts.

**Patterns:**
- Store `load*` methods: `try/catch`, set `isLoading: false` on failure, log to console, no error state exposed
- Page-level imports (PoB, JSON): `try/catch` wrapping the entire operation, `toast.error()` on failure
- PoB proxy API route: structured JSON error responses with appropriate HTTP status codes
- Share link decode: inline `try/catch` in `useDecoded()` hook, error message shown in UI

## Cross-Cutting Concerns

**Tutorial system:** `TutorialProvider` at `AppShell` level wraps all pages. Tour state (completed tours) persisted to `localStorage`. Tour components (`DashboardTour`, `BuildsTour`, `BuildEditorTour`) render alongside page content and self-dismiss once seen.

**Logging:** `console.error` only — no structured logging framework.

**Validation:** No runtime schema validation (no Zod). Type safety enforced at compile time only. Import handlers use manual structural checks.

**Authentication:** None. All data is local to the browser.

---

*Architecture analysis: 2026-03-20*
