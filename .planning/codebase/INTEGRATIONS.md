# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Path of Building (PoB) Build Sharing:**
- Service: pobb.in - community PoB build sharing host
  - SDK/Client: Native `fetch` (server-side, in `src/app/api/pob-proxy/route.ts`)
  - Auth: None required
  - Endpoint: `https://pobb.in/{id}/raw` (GET)
  - User-Agent: `PoE-SpeedRun-Planner/1.0`
  - Purpose: Retrieves raw PoB export codes (base64+zlib compressed XML) to avoid CORS restrictions on the client

**Google Fonts:**
- Service: `fonts.googleapis.com` (via Next.js font optimization)
  - SDK/Client: `next/font/google` in `src/app/layout.tsx`
  - Auth: None
  - Fonts loaded: Geist Sans, Geist Mono
  - Note: Next.js automatically self-hosts font files at build time; no runtime requests in production

## Data Storage

**Databases:**
- Type: Browser IndexedDB (local, client-side only)
  - ORM/Client: Dexie.js 4 (`dexie ^4.3.0`)
  - Definition: `src/db/database.ts`
  - DB name: `poe-planner`
  - Tables and indexes:
    - `regexPresets` — indexed on `id, name`
    - `builds` — indexed on `id, name, className`
    - `runs` — indexed on `id, buildPlanId, date`
    - `customGems` — indexed on `id, name`
    - `customItems` — indexed on `id, name`
  - Schema version: 3
  - All data is local to the user's browser — no server-side database
  - Writes are debounced 300ms via `setTimeout` in all three stores

**File Storage:**
- Local filesystem only (browser download API)
  - Export: `src/lib/export.ts` — `downloadJson()` uses `URL.createObjectURL` + programmatic `<a>` click
  - Import: `readFileAsJson()` uses `FileReader` API
  - Export format: versioned JSON (`version: 1`) containing `regexPresets`, `builds`, and/or `runs`

**Caching:**
- None (no Redis, Memcached, or server-side cache layer)

## Authentication & Identity

**Auth Provider:**
- None — the application has no user accounts, login, or session management
- All data is stored locally in the user's browser via IndexedDB
- IDs are generated client-side via `crypto.randomUUID()`

## Server-Side API Routes

**GET `/api/pob-proxy?id={id}`:**
- Location: `src/app/api/pob-proxy/route.ts`
- Purpose: CORS proxy for pobb.in — fetches raw PoB export code server-side and returns it as JSON `{ code: string }`
- Input validation: ID must match `/^[a-zA-Z0-9_-]+$/`
- Error handling: returns 400 for bad ID, passes through non-200 status codes from pobb.in, returns 502 on network failure
- This is the only server-side API route in the application

## PoB Import Pipeline

**Decode** (`src/lib/pob/decode.ts`):
- Input: base64 URL-safe string from pobb.in
- Processing: URL-safe base64 → standard base64 → `atob()` → `Uint8Array` → `pako.inflate` (or `pako.inflateRaw` fallback) → UTF-8 XML string
- Dependency: `pako ^2.1.0`

**Parse** (`src/lib/pob/parse.ts`):
- Input: PoB XML string
- Processing: browser `DOMParser` to extract class, ascendancy, skill groups, skill sets
- No external dependency — uses built-in DOM API

**Match** (`src/lib/pob/gem-matcher.ts`):
- Maps PoB gem `nameSpec` values to internal `gems.json` entries
- Pure in-memory lookup against `src/data/gems.json`

**Backfill** (`src/lib/pob/backfill.ts`):
- Places gem pickups at earliest quest-available stops
- Pure computation against `src/data/town-stops.ts` and `src/data/gem-rewards.ts`

## Static Game Data (Bundled)

All game data is bundled as static JSON/TypeScript files — no external game API calls:

- `src/data/gems.json` — ~300 PoE 1 gems (`{ skills: Gem[], supports: Gem[] }`)
- `src/data/items.json` — common item bases by category
- `src/data/classes.ts` — PoE 1 classes and ascendancies
- `src/data/town-stops.ts` — town stop/quest data for leveling route
- `src/data/gem-rewards.ts` — quest reward gem availability by class

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)

**Logs:**
- `console.error` used in store catch blocks (e.g., `useBuildStore.ts`, `useRegexStore.ts`)
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Not configured — no `vercel.json`, no Dockerfile, no deployment manifests present
- The standalone build (`npm run build` + `npm run standalone`) produces a self-contained Node.js server

**CI Pipeline:**
- None detected — no `.github/workflows/`, no CI config files present

## Environment Configuration

**Required env vars:**
- None detected — no `.env` files present, no `process.env` references in application code
- The pobb.in proxy uses a hardcoded URL; no API keys required

**Secrets location:**
- Not applicable — no secrets or credentials used

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (the pobb.in proxy is a one-way fetch initiated by user action, not a webhook)

---

*Integration audit: 2026-03-20*
