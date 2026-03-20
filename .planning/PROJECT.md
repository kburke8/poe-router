# PoE Speed Run Planner — Patch 3.28 Update

## What This Is

A Path of Exile 1 speed run planning tool that generates optimized regex search patterns for in-game stash filtering, manages build plans with gem progression through campaign stops, and tracks run history. This milestone updates the app for PoE patch 3.28, which introduces new gems, reworks existing gems, changes quest reward availability, and overhauls the regex collision system.

## Core Value

The regex abbreviation engine must generate the shortest possible unique patterns that never false-match against unrelated items in PoE's stash search — this is the one thing the tool exists to do reliably.

## Requirements

### Validated

- ✓ Regex abbreviation engine generates shortest unique patterns per gem/item — existing
- ✓ Regex combiner merges categories into PoE stash search string (250 char limit) — existing
- ✓ Six regex categories (gems, links, stats, items, item_gambas, dont_ever_show) — existing
- ✓ PoB import pipeline (decode, parse, gem-match, backfill) — existing
- ✓ Build plan editor with campaign stop progression — existing
- ✓ Gem inventory tracking with drop/undrop support — existing
- ✓ Link group phases that evolve across campaign stops — existing
- ✓ Run history with act split timing — existing
- ✓ Build sharing via compressed URL payloads — existing
- ✓ Guided wizard and advanced build editor modes — existing
- ✓ Tutorial/onboarding system — existing
- ✓ Standalone build output for self-hosting — existing
- ✓ Client-side only (IndexedDB via Dexie, no backend) — existing

### Active

- [ ] Update gem database for patch 3.28 (new gems, reworks, renames)
- [ ] Update quest reward/vendor gem availability for 3.28 changes
- [ ] Replace manual POE_ITEM_TEXT_SAMPLES with RePoE-sourced collision pool (all gem names + descriptions)
- [ ] Diff current gems.json against RePoE data to identify adds/removes/renames
- [ ] Import RePoE gems.min.json as static data committed to repo
- [ ] Investigate RePoE for quest reward data availability

### Out of Scope

- Runtime fetching from RePoE — static import per patch, not live dependency
- Automated patch detection — manual update per PoE patch cycle
- PoE 2 support — this is a PoE 1 tool
- Backend/auth/cloud sync — stays client-side only

## Context

- **Patch 3.28** adds new skill and support gems, reworks/renames existing gems, and changes quest reward gem availability
- **RePoE data source**: https://repoe-fork.github.io/poe1.html — machine-readable PoE 1 game data exports including gems.min.json
- **Current collision system** (`POE_ITEM_TEXT_SAMPLES` in `src/lib/regex/abbreviator.ts`) is a manually curated array of ~200+ text fragments. This is fragile — new gems or item text can cause false positives that require whack-a-mole fixes
- **Proposed improvement**: Replace manual collision pool entirely with RePoE gem names + descriptions, making the system self-correcting when gem data is updated
- **Current gem data**: `src/data/gems.json` has ~300 gems in `{ skills: Gem[], supports: Gem[] }` format
- **Quest reward data**: `src/data/gem-rewards.ts` maps quest rewards to gem availability per class. Need to check if RePoE provides equivalent data

## Constraints

- **Data format**: RePoE gems.min.json format must be transformed to match existing `Gem` type (`src/types/gem.ts`) and `gems.json` structure
- **Collision pool**: New collision pool must include all gem names AND gem description text to prevent false positives against stat lines
- **Backward compatibility**: Existing builds in users' IndexedDB must continue to work — gem renames need migration handling
- **PoE regex limit**: Stash search remains 250 characters max
- **Static import**: RePoE data committed to repo, not fetched at runtime

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace POE_ITEM_TEXT_SAMPLES with RePoE data | Manual collision pool is fragile and incomplete — systemic fix eliminates whack-a-mole | — Pending |
| Static import over runtime fetch | No external dependency at runtime; update is a deliberate per-patch action | — Pending |
| Diff gems.json against RePoE to find changes | More reliable than manually tracking patch notes for gem adds/removes/renames | — Pending |

---
*Last updated: 2026-03-20 after initialization*
