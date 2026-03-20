# Codebase Concerns

**Analysis Date:** 2026-03-20

---

## Critical

### No Error Boundaries Anywhere

- Issue: The entire app lacks React error boundaries. Any unhandled render-time exception (e.g., malformed IndexedDB data, bad share URL payload, unexpected `undefined` in a build object) will crash the whole page with a blank white screen and no recovery path.
- Files: `src/app/layout.tsx`, all page components under `src/app/`
- Impact: Any corrupt IndexedDB record or share link with schema drift silently kills the entire UI
- Fix: Add a root-level `<ErrorBoundary>` in `src/app/layout.tsx` and per-section boundaries around the regex builder, build editor, and run view

### Import Pipeline Has No Schema Validation

- Issue: JSON imports in `src/app/page.tsx` (handleImport), `src/app/builds/page.tsx` (handleJsonImport), and the share-link decoder `src/lib/share.ts` (decodeBuild) accept arbitrary payloads with no structural validation beyond presence of a `build.id` field. In `src/app/page.tsx` the migration patch is a naked `as any` cast that force-sets `version = 3` without checking whether fields like `linkGroups`, `stops`, or `gearGoals` actually exist.
- Files: `src/app/page.tsx:56-66`, `src/app/builds/page.tsx:74-92`, `src/lib/share.ts:20-38`, `src/lib/export.ts:45-63`
- Impact: A crafted or stale export file or share URL can inject arbitrary data into IndexedDB, causing silent data corruption or runtime crashes throughout the app
- Fix: Add Zod or a hand-rolled validator in `parseImportFile` and `decodeBuild` that enforces required fields match the current `BuildPlan` type

### Migration Function Is Dead Code — No Migration Is Applied on Load

- Issue: `src/lib/migration.ts` exports `migrateBuildV1toV2` but it is never imported or called anywhere in the app. `src/app/page.tsx` patches version 2 builds by manually setting `b.version = 3` but does not run structural migration (strips `stop.linkGroups` but does nothing else). There is no V2→V3 migration path. Dexie's `version(3)` block defines no `upgrade` callback, so old records are loaded as-is by `db.builds.toArray()` and cast directly to `BuildPlan`.
- Files: `src/lib/migration.ts`, `src/db/database.ts:16`, `src/app/page.tsx:55-66`, `src/stores/useBuildStore.ts:119`
- Impact: Users with V1 or V2 builds in IndexedDB from older versions of the app will load corrupted state silently. The `activeBuild` getter and all store mutations will receive wrong-shaped objects.
- Fix: Add an `upgrade` callback in `src/db/database.ts` version 3 block that applies the V1→V2→V3 migration chain on load

---

## Moderate

### `stat-translations.json` Is a 82 KB Dead Asset Bundled Into the App

- Issue: `src/data/stat-translations.json` (82 759 bytes on disk, roughly 83 KB raw) is committed to `src/data/` but is never imported anywhere in the source tree. Next.js includes everything in `src/data/` that is imported; if it is imported transitively via a barrel file or directly it will bloat the client bundle.
- Files: `src/data/stat-translations.json`
- Impact: If bundled, it adds ~83 KB to the client chunk that imports the data directory. Even if tree-shaken it clutters the repo.
- Fix: Delete the file or move it to a `scripts/` subdirectory if it is only used during data generation

### Abbreviator Has Quadratic Collision-Resolution Runtime

- Issue: `computeAbbreviations` in `src/lib/regex/abbreviator.ts:647-698` runs a nested O(n²) loop over all selected entries per iteration, with up to 20 iterations. For each pair `(i, j)` it calls `patternMatches` twice and potentially `extendAbbreviation`. `extendAbbreviation` itself calls `countMatches` which iterates the entire `fullPool` (all gem names + ~500 gem descriptions + ~920 base item names + ~200 PoE text samples ≈ 1 900+ strings) for every candidate substring. For a build with 30+ vendor gems this runs thousands of regex comparisons synchronously on the main thread.
- Files: `src/lib/regex/abbreviator.ts:647-698`, `src/lib/regex/abbreviator.ts:704-749`
- Impact: Noticeable UI freeze (50–300 ms estimated) when generating build regex via `generateBuildRegex` in `src/lib/regex/generate-from-build.ts:430`. Triggered on every "Generate Regex" action.
- Fix: Move `generateBuildRegex` calls into a Web Worker or `setTimeout` microtask; cache compiled RegExp objects rather than re-compiling in `patternMatches` on every call

### `RunView` Is an 828-Line God Component

- Issue: `src/components/builds/RunView.tsx` is 828 lines and contains the main `RunView` export plus four private components (`EndOfActSummary`, `StopBlock`, `LinkGroupLine`, `formatSocketSummary`). `StopBlock` itself computes quest labels, groups gem pickups, resolves link groups, and renders all gem categories in a single function body.
- Files: `src/components/builds/RunView.tsx`
- Impact: Difficult to test, modify, or extend. Any change risks regressions across all detail levels. `StopBlock` re-derives its quest-diff logic inline on every render with no memoization.
- Fix: Extract `StopBlock` and `LinkGroupLine` to their own files under `src/components/builds/`; memoize the per-stop quest diff computation

### Single Global `saveTimer` Causes Cross-Store Save Collisions

- Issue: Both `src/stores/useBuildStore.ts:79` and `src/stores/useRegexStore.ts:55` declare a module-level `let saveTimer`. Each store has its own timer variable, but within `useBuildStore` all 30+ mutation actions share a single `saveTimer`. A rapid sequence of mutations to different builds (e.g., reorder then update notes) will cancel the first save and only write the second build — potentially losing the first mutation if the page is closed within the 300 ms window.
- Files: `src/stores/useBuildStore.ts:79-89`, `src/stores/useRegexStore.ts:55-65`
- Impact: Under rapid user input (typing notes, drag-and-drop reorder) the last write wins and an intermediate state may be lost on page close
- Fix: Key the debounce timer by `buildId` using a `Map<string, ReturnType<typeof setTimeout>>`, or use a write queue per entity

### `zoom` CSS Property Used for Font Scaling

- Issue: `src/components/builds/RunView.tsx:334` applies `style={{ zoom: fontScale / 100 }}` to the act timeline container. The `zoom` property is not part of the CSS standard and has historically inconsistent behavior across browsers (it is not supported in Firefox as a non-standard property and its interaction with `position: sticky` and scroll containers is browser-specific).
- Files: `src/components/builds/RunView.tsx:334`
- Impact: Font scaling will silently fail or produce incorrect layout in Firefox; the sticky end-of-act side column (`sticky top-4` at line 436) is particularly at risk
- Fix: Replace `zoom` with a CSS custom property (`--font-scale`) applied via `transform: scale()` on individual text nodes, or use a `fontSize` root override with `em`-based descendant sizing

### Share URL Encoding Uses `String.fromCharCode(...compressed)` Spread

- Issue: `src/lib/share.ts:15` uses `btoa(String.fromCharCode(...compressed))` where `compressed` is a `Uint8Array`. Spreading a large `Uint8Array` into `String.fromCharCode` as variadic args will hit the JavaScript call stack argument limit (`RangeError: Maximum call stack size exceeded`) for builds larger than ~125 KB uncompressed (stack limit is typically 65 535 arguments).
- Files: `src/lib/share.ts:15`
- Impact: Sharing large builds with many stops, link groups, or embedded regex presets will throw a `RangeError` rather than gracefully falling back to "build too large" messaging. The 8 000-character URL check at `RunView.tsx:116` only catches the post-encode size, not the encode crash.
- Fix: Replace with a chunked approach: `let b64 = ''; for (let i = 0; i < compressed.length; i += 8192) { b64 += String.fromCharCode(...compressed.subarray(i, i + 8192)); } return btoa(b64)`

### `useBuildStore.ts` Declared `'use client'` But Is Imported By Server-Adjacent Code

- Issue: `src/stores/useBuildStore.ts:1` declares `'use client'`. The store uses `localStorage` indirectly through components and `crypto.randomUUID()` at module init time. However `src/lib/regex/generate-from-build.ts` is a pure library file (no directive) that imports from `@/data/gems.json` at module level. If `generateBuildRegex` is ever called from a Server Component context, or if the store file is somehow server-evaluated, the `crypto` global and `db` import (Dexie) will fail.
- Files: `src/stores/useBuildStore.ts:1`, `src/db/database.ts`
- Impact: Low risk currently since all consumers are `'use client'`; becomes critical if a Server Component ever imports a lib that transitively reaches the store

### JSON Import Silently Ignores Schema Version Mismatch for Builds

- Issue: `src/app/page.tsx:59` patches imported builds by force-assigning `b.version = 3` via `as any` without running any migration logic. `src/lib/migration.ts` exists but is never called. The `readFileAsJson` function in `src/lib/export.ts` validates the export envelope version (`=== 1`) but not the internal `BuildPlan.version` field.
- Files: `src/app/page.tsx:56-66`, `src/lib/migration.ts`
- Impact: V1 builds (act-based, no `stops` array, no `linkGroups`) imported through the dashboard will be stored as version-3 records with missing required arrays, causing crashes on the builds page and editor

---

## Minor

### `alert()` Used for Import Success/Failure Feedback

- Issue: `src/app/page.tsx:77` and `src/app/page.tsx:79` call native `alert()` for import feedback while the rest of the app uses `sonner` toasts. This is inconsistent and `alert()` is blocking.
- Files: `src/app/page.tsx:77-79`
- Fix: Replace with `toast.success()` / `toast.error()` matching the pattern used in `src/app/builds/page.tsx`

### `customGems` and `customItems` Tables Are Defined But Never Used

- Issue: `src/db/database.ts:11-12` defines `customGems` and `customItems` Dexie tables that are not referenced anywhere in the application. They represent an unfinished feature.
- Files: `src/db/database.ts:11-12`
- Impact: Minor: dead schema, marginally increases IndexedDB overhead on first open
- Fix: Remove the table definitions until the feature is implemented, or add a tracking issue

### `handleTemplateSelect` Is a Documented No-Op

- Issue: `src/app/builds/page.tsx:54` defines `handleTemplateSelect` with the comment "This function will never be called since templates are disabled". The `TemplatePickerDialog` component is imported and rendered but its `onSelect` handler does nothing.
- Files: `src/app/builds/page.tsx:54-57`
- Impact: Dead code; confuses future maintainers
- Fix: Either implement template selection or remove the `TemplatePickerDialog` import and component from the builds page

### `src/data/stat-translations.json` Committed But Unused

- Issue: An 82 KB JSON file with PoE stat translation strings (`src/data/stat-translations.json`) exists in the data directory but is not imported anywhere. It was likely generated by `scripts/fetch-repoe-data.ts` for a planned feature.
- Files: `src/data/stat-translations.json`
- Fix: Remove from repo or move to `scripts/data/` to prevent accidental imports

### No Rate Limiting or Caching on the PoB Proxy API Route

- Issue: `src/app/api/pob-proxy/route.ts` proxies requests to `pobb.in` with no rate limiting, no caching, and no timeout on the upstream `fetch`. A user (or bot) can hammer the endpoint and cause repeated outbound requests to `pobb.in`, which could result in the server's IP being rate-limited or blocked by pobb.in.
- Files: `src/app/api/pob-proxy/route.ts`
- Impact: Low risk in production self-hosted deployment; higher if deployed to a shared platform. The missing `AbortSignal` timeout means a slow `pobb.in` response holds the serverless function slot open indefinitely.
- Fix: Add `signal: AbortSignal.timeout(10_000)` to the fetch call; add a simple in-memory LRU cache keyed by `id`

### Vitest Is Configured `environment: 'node'` — DOM-Dependent Code Cannot Be Tested

- Issue: `vitest.config.ts:7` sets `environment: 'node'`. Tests for `src/lib/pob/parse.ts` use `DOMParser` (a browser API), which works only because `jsdom` is installed as a dev dependency but is not configured as the test environment. The `parsePobXml` function calls `new DOMParser()` which is not available in Node without jsdom injection.
- Files: `vitest.config.ts`, `src/lib/pob/parse.ts:63-65`, `tests/lib/pob/parse.test.ts`
- Impact: `parse.test.ts` may be silently skipped or fail if DOMParser is not polyfilled. Any future component tests would require switching environments.
- Fix: Set `environment: 'jsdom'` globally or add a per-file `@vitest-environment jsdom` comment to files requiring DOM APIs

### No Tests for UI Components or Store Mutations

- Issue: All 16 test files in `tests/` cover only pure library functions (`lib/`, `data/`). Zero tests exist for any Zustand store mutation, React component, or page-level behavior. The most complex user-facing logic — `BuildEditor`, `RunView`, `StopSection`, wizard flows — has no test coverage at all.
- Files: `tests/` (all files)
- Impact: Regressions in component logic (e.g., gem inventory display, cross-link-group filtering, detail level rendering) are only caught manually
- Priority: High for `src/stores/useBuildStore.ts` (30+ mutations), `src/lib/gem-inventory.ts`, and `src/components/builds/RunView.tsx`

### `getInventoryAtStop` Uses Floating-Point Ordering for Custom Stops

- Issue: `src/lib/gem-inventory.ts:18` assigns `order = stopOrderMap.get(stop.afterStopId) + 0.5` for custom stops. If two custom stops share the same `afterStopId`, they both get the same effective order `(sortOrder + 0.5)` and their relative pickup sequence is determined by array iteration order, not any explicit ordering.
- Files: `src/lib/gem-inventory.ts:18`, `src/lib/gem-inventory.ts:46-51`
- Impact: Gem inventory at a second custom stop may not include gems picked up at the first custom stop after the same anchor
- Fix: Assign incrementing offsets (0.1, 0.2, …) based on the custom stop's index among siblings sharing the same `afterStopId`

### `src/lib/pob/backfill.ts` Has a Dead `slotLabel` Function

- Issue: `src/lib/pob/backfill.ts:133-137` defines `slotLabel(_slot, label)` where the `_slot` parameter is explicitly ignored (prefixed `_`). The function body simply returns `label` unchanged. It exists as a thin wrapper that adds no value.
- Files: `src/lib/pob/backfill.ts:133-137`
- Fix: Inline the `label || ''` expression at the call site (`backfill.ts:331`) and delete `slotLabel`

### `navigator.clipboard.writeText` Called Without Error Handling in Two Places

- Issue: `src/components/builds/RunView.tsx:120` and `src/components/builds/BuildCard.tsx:40` call `navigator.clipboard.writeText(...).then(...)` with no `.catch()`. The Clipboard API can throw in non-HTTPS contexts or when clipboard permissions are denied.
- Files: `src/components/builds/RunView.tsx:120`, `src/components/builds/BuildCard.tsx:40`
- Impact: Silent failure when the user denies clipboard permission; no fallback copy mechanism
- Fix: Add `.catch(() => toast.error('Failed to copy to clipboard'))` matching the pattern used in `src/hooks/useCopyToClipboard.ts`

### Accessibility: Interactive Controls Lack Labels

- Issue: The font scale `-` and `+` buttons in `src/components/builds/RunView.tsx:189-204` have no `aria-label`. The detail level `<input type="range">` at line 250 has no `<label>` element or `aria-label` — the `<span>` is a visual sibling but not programmatically associated. The bulk buy checkbox at line 262 uses a `<label>` wrapping pattern but the character name `<input>` at line 273 only has a `placeholder`, not a label.
- Files: `src/components/builds/RunView.tsx:189-204`, `src/components/builds/RunView.tsx:250-258`, `src/components/builds/RunView.tsx:273`
- Impact: Screen reader users receive no meaningful context for these controls

---

## Dependencies at Risk

### `next` Is Pinned to `16.1.6` — A Pre-Release Version

- Issue: `package.json` pins `"next": "16.1.6"`. As of the analysis date, Next.js stable is 15.x; version 16 is canary/prerelease. Pre-release builds receive no backported security patches and can introduce breaking changes without semver guarantees.
- Files: `package.json`
- Impact: Any security vulnerability discovered in Next.js 15 or 16 may not be patched for the 16.x prerelease track
- Fix: Audit whether Next.js 16 features are strictly required; if not, pin to `15.x` stable

### `react` and `react-dom` Pinned to `19.2.3` — RC Track

- Issue: React 19.2.3 is a release-candidate version pinned exactly in `package.json`. Minor ecosystem packages (Radix UI, `sonner`, `driver.js`) may not have been tested against React 19 RC.
- Files: `package.json`
- Impact: Low probability but possible incompatibilities with third-party components that inspect React internals

---

*Concerns audit: 2026-03-20*
