# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5 (strict mode) - all application code in `src/`
- CSS - global styles in `src/app/globals.css`, theme overrides in `src/styles/driver-overrides.css`

**Secondary:**
- JSON - static game data in `src/data/` (gems.json, items.json)

## Runtime

**Environment:**
- Node.js 22.18.0 (confirmed via local runtime)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router, standalone output mode (`output: 'standalone'` in `next.config.ts`)
- React 19.2.3 - UI rendering
- React DOM 19.2.3 - DOM bindings

**Styling:**
- Tailwind CSS v4 (`tailwindcss ^4`) - utility-first CSS
- PostCSS via `@tailwindcss/postcss` - configured in `postcss.config.mjs`
- Theme: dark PoE-inspired, backgrounds `#1a1a2e`/`#16213e`, accent gold `#c7a44a`

**Testing:**
- Vitest 4.0.18 - test runner (`vitest.config.ts`)
  - Environment: `node`
  - Test files: `tests/**/*.test.ts`
  - Coverage via `@vitest/coverage-v8`
  - DOM simulation: `jsdom ^28.1.0`

**Build/Dev:**
- Next.js CLI (`npm run dev`, `npm run build`)
- Standalone output: `.next/standalone/poe-router/server.js` (run with `npm run standalone`)
- ESLint 9 - configured in `eslint.config.mjs` using `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`

## Key Dependencies

**State Management:**
- `zustand ^5.0.11` - global state stores; all stores use `immer` middleware
- `immer ^11.1.3` - immutable nested state updates via `produce`-style mutations
  - Pattern: `create<State>()(immer((set, get) => ({ ... })))` in `src/stores/`

**Persistence:**
- `dexie ^4.3.0` - IndexedDB ORM; database defined at `src/db/database.ts`
  - DB name: `poe-planner`
  - Tables: `regexPresets`, `builds`, `runs`, `customGems`, `customItems`
  - Schema version: 3
  - Stores debounce saves 300ms via `setTimeout` pattern

**UI Components:**
- `@radix-ui/react-collapsible ^1.1.12` - collapsible sections
- `@radix-ui/react-dialog ^1.1.15` - modal dialogs
- `@radix-ui/react-popover ^1.1.15` - popover menus
- `@radix-ui/react-tooltip ^1.2.8` - tooltips
- `lucide-react ^0.563.0` - icon library
- `sonner ^2.0.7` - toast notifications (used in `src/app/layout.tsx` as `<Toaster theme="dark" richColors />`)
- `clsx ^2.1.1` - conditional classname composition

**Drag and Drop:**
- `@dnd-kit/core ^6.3.1` - drag-and-drop primitives
- `@dnd-kit/sortable ^10.0.0` - sortable list support
- `@dnd-kit/utilities ^3.2.2` - DnD utility helpers

**Search:**
- `fuse.js ^7.1.0` - fuzzy search for gem/item pickers

**PoB Import:**
- `pako ^2.1.0` - zlib inflate/inflateRaw for decompressing PoB export codes
  - Used in `src/lib/pob/decode.ts`: tries `pako.inflate` first, falls back to `pako.inflateRaw`

**Onboarding:**
- `driver.js ^1.4.0` - guided product tours
  - Custom PoE-themed styles in `src/styles/driver-overrides.css`

**Fonts:**
- `next/font/google` - Geist Sans and Geist Mono loaded in `src/app/layout.tsx`

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Module resolution: `bundler`
- `resolveJsonModule: true` (enables direct import of `.json` data files)

**Build:**
- `next.config.ts` - standalone output only; no custom webpack, rewrites, or redirects
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin only

**Linting:**
- `eslint.config.mjs` - Next.js core-web-vitals + TypeScript rules; ignores `.next/`, `out/`, `build/`

**Testing:**
- `vitest.config.ts` - path alias mirrors tsconfig `@/*`, node environment, test glob `tests/**/*.test.ts`

## Platform Requirements

**Development:**
- Node.js (v22 in use)
- npm
- Run: `npm run dev`

**Production:**
- `npm run build` generates `.next/standalone/poe-router/server.js`
- Run standalone: `node .next/standalone/poe-router/server.js` (no `node_modules` needed)
- Static assets (`.next/static/` and `public/`) must be copied alongside standalone bundle

---

*Stack analysis: 2026-03-20*
