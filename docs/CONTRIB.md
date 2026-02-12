# Contributing

## Prerequisites

- **Node.js** >= 18
- **npm** (ships with Node.js)

## Environment Setup

```bash
git clone <repo-url>
cd poe-router
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

No `.env` file is required. The app is entirely client-side with IndexedDB storage (via Dexie.js) — there are no API keys, databases, or external services to configure.

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js development server with hot reload |
| `build` | `npm run build` | Production build (also generates standalone bundle) |
| `start` | `npm run start` | Start production server (requires `npm run build` first) |
| `lint` | `npm run lint` | Run ESLint across the project |
| `standalone` | `npm run standalone` | Run the standalone Node.js server on localhost:3000 (requires `npm run build` first) |

### Utility Scripts

Run with `npx tsx scripts/<file>.ts`:

| Script | Purpose |
|--------|---------|
| `test_new_patterns.ts` | Test regex abbreviation patterns for specific gems and check for false positives |
| `find_collisions4.ts` | Test a set of regex patterns against full PoE gem text to find false-positive collisions |
| `test_build2.ts` | Test a single abbreviation and verify it doesn't collide with unrelated text |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout, dark theme, providers
│   ├── page.tsx            # Dashboard
│   ├── regex/page.tsx      # Regex Builder
│   ├── builds/
│   │   ├── page.tsx        # Build list
│   │   ├── [id]/page.tsx   # Build editor
│   │   └── [id]/run/page.tsx  # Run view (guided playthrough)
│   └── history/page.tsx    # Run history
├── components/
│   ├── ui/                 # Shared primitives (Button, Card, Input, etc.)
│   ├── layout/             # AppShell, Sidebar
│   ├── regex/              # RegexBuilder, CategoryPanel, ExclusionPanel,
│   │                         GemSearchPicker, ItemSearchPicker, RegexEntryRow, RegexPreview
│   ├── builds/             # BuildEditor, BuildHeader, BuildCard, StopSection,
│   │                         PhaseEditor, GemPickerDialog, GemPickupList,
│   │                         GearGoalsPanel, MuleSection, RunView, etc.
│   └── history/            # RunForm, RunCard, ActSplitTimesEditor
├── stores/                 # Zustand stores (useRegexStore, useBuildStore, useRunHistoryStore)
├── db/database.ts          # Dexie IndexedDB definition
├── data/
│   ├── gems.json           # ~300 PoE 1 gems (skills + supports)
│   ├── items.json          # Common item bases by category
│   ├── classes.ts          # PoE 1 classes + ascendancies
│   ├── town-stops.ts       # Town stop/quest data for leveling route
│   └── gem-rewards.ts      # Quest reward gem availability data
├── lib/
│   ├── regex/
│   │   ├── abbreviator.ts  # Name -> shortest unique regex pattern engine
│   │   └── combiner.ts     # Combines categories into final one-liner
│   ├── gem-availability.ts # Gem availability logic by quest/vendor
│   ├── gem-costs.ts        # Gem purchase cost calculations
│   ├── link-group-resolver.ts # Resolves gem link groups across stops
│   ├── migration.ts        # IndexedDB schema migration helpers
│   ├── export.ts           # JSON import/export
│   └── utils.ts
├── hooks/                  # useDebounce, useCopyToClipboard
└── types/
    ├── regex.ts            # RegexPreset, RegexCategory, RegexEntry, RegexCategoryId
    ├── build.ts            # BuildPlan, ActPlan, GemSetup, GearGoal, SkillTransition
    ├── history.ts          # RunRecord, ActSplit
    └── gem.ts              # Gem, Item, GemColor, GemType, ItemCategory
```

## Development Workflow

1. **Pick an issue** or feature to work on
2. **Create a branch** from `main`
3. **Run the dev server** with `npm run dev`
4. **Make changes** — the app hot-reloads
5. **Run `npm run lint`** before committing
6. **Test your changes** in the browser — pay special attention to:
   - Regex patterns: verify no false positives with `npx tsx scripts/test_new_patterns.ts`
   - Build editor: verify gem availability and link groups resolve correctly
   - Data persistence: ensure IndexedDB saves/loads work (check Application tab in DevTools)
7. **Run `npm run build`** to verify the production build succeeds
8. **Submit a pull request**

## Key Areas

### Regex Abbreviation Engine

The most complex part of the codebase is `src/lib/regex/abbreviator.ts`. It generates the shortest unique regex pattern for each gem/item name that won't false-match in PoE's stash search.

When fixing collision issues:
1. Identify which pattern collides using a test script (see `scripts/`)
2. Find the text fragment causing the match
3. Add that fragment to `POE_ITEM_TEXT_SAMPLES` in `abbreviator.ts`
4. The engine will automatically generate a longer pattern that avoids it
5. Verify with a test script

### Data Files

- `gems.json` and `items.json` contain PoE 1 game data. Changes should reflect actual in-game values.
- `town-stops.ts` and `gem-rewards.ts` encode the leveling route. Reference [poewiki.net](https://poewiki.net) (NOT fandom wiki).

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Conditional classes: use `clsx`
- IDs: `crypto.randomUUID()`
- Dates: ISO strings
- State: Zustand + Immer for immutable nested updates
- Persistence: Dexie.js with 300ms debounced saves
- UI primitives: Radix UI (headless) + Tailwind CSS v4
