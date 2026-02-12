# PoE Speed Run Planner

A Path of Exile 1 speed run planning tool with regex pattern generation, build planning, and run history tracking.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS v4** - dark PoE-inspired theme (backgrounds: `#1a1a2e`/`#16213e`, accent: `#c7a44a` gold)
- **Zustand 5** + **Immer** - state management with immutable nested updates
- **Dexie.js 4** - IndexedDB persistence (`src/db/database.ts`)
- **Fuse.js 7** - fuzzy search for gem/item pickers
- **Radix UI** - headless primitives (dialog, popover, collapsible, tooltip)
- **Lucide React** - icons
- **Sonner** - toast notifications

## Commands

- `npm run dev` - start dev server
- `npm run build` - production build (also generates standalone bundle)
- `npm run standalone` - run standalone server (after build) on localhost:3000
- `npm run lint` - ESLint
- `npx tsx scripts/<file>.ts` - run utility scripts

### Standalone Build

The app uses Next.js standalone output mode (`output: 'standalone'` in `next.config.ts`). After `npm run build`, a self-contained server is generated at `.next/standalone/poe-router/server.js` that can be run with just Node.js — no `node_modules` needed. Static assets (`.next/static/` and `public/`) must be copied alongside the standalone directory for full functionality.

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
│   ├── ui/                 # Button, Card, Input, Textarea, Badge, CopyButton, SocketColorIndicator
│   ├── layout/             # AppShell, Sidebar
│   ├── regex/              # RegexBuilder, CategoryPanel, ExclusionPanel, GemSearchPicker,
│   │                         ItemSearchPicker, RegexEntryRow, RegexPreview
│   ├── builds/             # BuildEditor, BuildHeader, BuildCard, StopSection, StopHeader,
│   │                         PhaseEditor, GemPickerDialog, GemPickupList, GearGoalsPanel,
│   │                         GemSlotCombobox, MuleSection, InheritedLinkGroupCard, RunView
│   └── history/            # RunForm, RunCard, ActSplitTimesEditor
├── stores/                 # Zustand stores (useRegexStore, useBuildStore, useRunHistoryStore)
├── db/database.ts          # Dexie DB definition
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

## Key Architecture

### Regex Abbreviation Engine (`src/lib/regex/abbreviator.ts`)

This is the most critical and complex file. It generates the shortest unique regex pattern for each gem/item name that won't false-match against PoE's in-game item search.

**PoE search behavior**: Searches the ENTIRE item text (name, item class, rarity, mods, requirements, gem descriptions) not just item names. This means short patterns like `"and"` will match hundreds of items.

**PoE regex features supported**: `.` (any single char), `.+` (one or more chars), `^` (line start anchor)

**Algorithm (5 phases)**:
1. Plain substrings (min 4 chars, spaces become `.`)
2. `^` prefix patterns (anchored to line start, 3+ chars)
3. Cross-word `.` wildcard patterns (e.g., `me.wal`)
4. `.+` spanning patterns across word gaps
5. Fallback to full name

**`POE_ITEM_TEXT_SAMPLES` array**: A collision pool of ~200+ realistic PoE text fragments (magic item names, mod lines, gem descriptions, common phrases like "damage around", "Bleeding", "Melee Physical Damage", etc.). The abbreviator treats these as additional names that must not be matched. When users report false positives, the fix is to add the collision-causing text to this pool.

**Exported functions**:
- `abbreviate(name, allNames)` - single name abbreviation
- `computeAbbreviations(selectedNames, allNames)` - batch with inter-abbreviation collision resolution

### Regex Combiner (`src/lib/regex/combiner.ts`)

Combines regex categories into final one-liner: `!<exclusions joined with |> <inclusions joined with |>`

PoE 1 stash search has a **250 character limit**.

### Regex Categories

Six categories defined in `RegexCategoryId`: `gems`, `links`, `stats`, `items`, `item_gambas`, `dont_ever_show`. The `dont_ever_show` category entries are exclusions (prefixed with `!`).

### Stores

All Zustand stores use Immer for immutable updates and Dexie for IndexedDB persistence with debounced saves (300ms).

### Gem Data

- `gems.json` has `{ skills: Gem[], supports: Gem[] }` structure
- Gem colors: `red` (Strength), `green` (Dexterity), `blue` (Intelligence)
- Gem names in the picker are colored by their socket color

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Components use `clsx` for conditional classnames
- All IDs use `crypto.randomUUID()`
- Dates stored as ISO strings

## PoE Domain Knowledge

- PoE wiki reference: **poewiki.net** (NOT fandom wiki - fandom is outdated)
- Item search format: `!exclusion inclusion1|inclusion2` where `!` negates, `|` is OR, space is AND
- Gem colors are determined by primary attribute: Str=red, Dex=green, Int=blue
- Support gems that require two attributes use the higher requirement's color
- "Gambas" = gamble items (items bought from vendors hoping for good rolls)

## Fixing False Positive Collisions

When users report that a regex pattern highlights unintended gems/items:

1. Identify which pattern(s) collide using a test script (see `scripts/`)
2. Find the specific text fragment causing the match (e.g., `"age.ar"` matching `"damage around"`)
3. Add that text fragment to `POE_ITEM_TEXT_SAMPLES` in `src/lib/regex/abbreviator.ts`
4. The abbreviator will automatically generate a longer/different pattern that avoids the collision
5. Verify with a test script that the new pattern has zero false positives
