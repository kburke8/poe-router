# Roadmap: PoE Speed Run Planner — Patch 3.28 Update

## Overview

This milestone updates the PoE Speed Run Planner for patch 3.28 by building an automated data pipeline from RePoE, overhauling the collision pool, migrating existing user builds through gem renames, and updating quest/vendor reward tables. The work flows in a strict dependency chain: produce correct data first, wire up migration safety second, then update manual reward tables last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Pipeline and Collision Pool** - Automated RePoE gem transform, diff/rename detection, and collision pool overhaul in a unified script
- [ ] **Phase 2: Migration Layer** - Safe rename migration for IndexedDB builds, PoB imports, and JSON exports before deploying updated data
- [ ] **Phase 3: Quest and Vendor Rewards** - Manual update of quest reward and class data for 3.28 changes, validated against finalized gem list

## Phase Details

### Phase 1: Data Pipeline and Collision Pool
**Goal**: A single script produces correct, validated gem data and a collision pool that eliminates manual maintenance for future patches
**Depends on**: Nothing (first phase)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, COLL-01, COLL-02, COLL-03, COLL-04
**Success Criteria** (what must be TRUE):
  1. Running `npx tsx scripts/fetch-repoe-data.ts` produces a valid gems.json with all 3.28 gems (including Holy Strike, Holy Hammers, Divine Blast, Shield of Light, Blessed Call, Excommunicate, Exemplar, Hallow) and no transfigured/Exceptional gems
  2. The script outputs a human-readable diff report showing adds, removes, and renames (including Sweep to Holy Sweep), plus a gem-rename-map.json consumable by the migration layer
  3. The collision pool merges RePoE gem names and descriptions with retained manual entries, and the abbreviator produces zero false positives when tested against the new pool
  4. Abbreviation performance with the larger pool stays under 500ms for 10 gems, and pool metadata includes a version identifier
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Unified pipeline script: gem extraction, filtering, diff, rename map, collision pool data with metadata
- [ ] 01-02-PLAN.md — Abbreviator integration: wire gem-names.json into collision pool, regression + performance validation

### Phase 2: Migration Layer
**Goal**: Existing user builds survive the gem rename transition with no data loss and no manual intervention
**Depends on**: Phase 1 (consumes gem-rename-map.json)
**Requirements**: MIGR-01, MIGR-02, MIGR-03
**Success Criteria** (what must be TRUE):
  1. A user with a pre-3.28 build containing "Sweep" opens the app and sees "Holy Sweep" everywhere (gem pickups, link group slots, dropped gems, mule pickups) without any action on their part
  2. Before migration runs, the app automatically exports a backup JSON of the user's builds to their downloads folder
  3. Importing a PoB export code that references old gem names (pre-3.28) correctly resolves to the renamed gems in the resulting build plan
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Core migration manager: gem rename functions for builds/presets, backup orchestration, app startup wiring
- [ ] 02-02-PLAN.md — PoB gem-matcher rename fallback: old gem names resolve via rename map during PoB import

### Phase 3: Quest and Vendor Rewards
**Goal**: The build planner places new and renamed gems at their correct earliest-available campaign stops for all classes
**Depends on**: Phase 1 (needs finalized gem names), Phase 2 (renamed gems must resolve correctly in reward lookups)
**Requirements**: QRWD-01, QRWD-02
**Success Criteria** (what must be TRUE):
  1. A Templar build starts with Holy Strike and Hallow Support as beach gems, and these appear in the correct starting stop
  2. All gem names in gem-rewards.ts and classes.ts exist in the updated gems.json (validated by a cross-check script with zero mismatches)
  3. Running the PoB backfill for a 3.28 Templar build places new gems at the earliest quest/vendor stop where they become available, not at Act 6 Lilly Roth
**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md — Data updates + validation: rename/remove/add gem entries in gem-rewards.ts, update Templar beach gems in classes.ts, cross-check validation script

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline and Collision Pool | 2/2 | Complete | 2026-03-20 |
| 2. Migration Layer | 2/2 | Complete | 2026-03-20 |
| 3. Quest and Vendor Rewards | 0/1 | Not started | - |
