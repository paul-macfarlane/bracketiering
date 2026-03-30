# Task: Scenario-Aware Elimination Detection

**Story:** #82 from backlog.md
**Status:** done
**Branch:** feat/scenario-aware-elimination

## Plan

- [x] Add `isFinalFourMode`, `generateScenarios`, and `getScenarioEliminationStatus` functions in `lib/scoring.ts`
- [x] Extend `getPoolStandings` to return scenario data when in Final Four mode
- [x] Update pool detail page to use scenario-based elimination for My Brackets section
- [x] Update bracket detail page to use scenario-based elimination
- [x] Update `StandingsTable` component to use scenario-based elimination (client-side for contention toggle)
- [x] Write unit tests covering correlated-pick edge cases
- [x] Verify build, lint, and tests pass

## Decisions

### Compute elimination client-side vs server-side

**Context:** The contention toggle (1st, Top 2, Top 3) is a client-side state that changes which topN value is used for elimination. Scenario data is needed for the computation.
**Decision:** Pass compact scenario data (remaining games + per-entry picks for those games) to the client. StandingsTable computes scenario elimination client-side when data is available.
**Alternatives considered:** Pre-compute all 3 topN maps server-side. Rejected because it would duplicate computation and the client-side approach is trivially fast for 8 scenarios. Also aligns with future story #83 (scenario simulator) which will need the same data.

### Conservative tie handling

**Context:** In scenario projections, we don't know the actual championship score, so tiebreakers can't be computed.
**Decision:** When entries are tied on projected points in a scenario, treat neither as definitively ahead. An entry is only "behind" if another entry has strictly more points. This means tied entries are NOT considered eliminated.
**Alternatives considered:** Considering ties as losses (too aggressive) or trying to estimate tiebreaker outcomes (too speculative).

### Return type change for getPoolStandings

**Context:** `getPoolStandings` now needs to return scenario data alongside standings.
**Decision:** Changed return type from array to `{ standings, scenarioData }` object. Updated both callers (pool detail page, bracket detail page).
**Alternatives considered:** Separate function to compute scenario data. Rejected because `getPoolStandings` already loads all needed data (games, picks).

## Changes Made

- `lib/scoring.ts`: Added `isFinalFourMode()`, `generateScenarios()`, `getScenarioEliminationStatus()`, and supporting types (`RemainingGame`, `ScenarioData`)
- `lib/scoring.test.ts`: Added tests for `isFinalFourMode` (5 tests), `generateScenarios` (4 tests), `getScenarioEliminationStatus` (6 tests covering correlated picks, different picks, full F4, top-N contention, ties, missing picks)
- `lib/db/queries/bracket-entries.ts`: Extended `getPoolStandings` to return `{ standings, scenarioData }` — builds scenario data when `isFinalFourMode` is true; added `sourceGame1Id`/`sourceGame2Id` to game query
- `app/(app)/pools/[id]/page.tsx`: Destructure new return type; use `getScenarioEliminationStatus` for My Brackets when scenario data available; pass `scenarioData` and `poolScoring` to `StandingsTable`
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Destructure new return type; use `getScenarioEliminationStatus` when scenario data available
- `components/pool/standings-table.tsx`: Accept `scenarioData` and `poolScoring` props; use scenario-based elimination in client-side `useMemo` when available; added `tiebreakerDiff` to local `StandingsEntry` interface

## Verification

- Self-code review: done (no issues — 3 nits noted, none blocking)
- Format: pass (no changes)
- Lint: pass (zero errors/warnings)
- Build: pass (zero TypeScript errors)
- Test: pass (84 tests, 15 new)
- Knip: 1 pre-existing unused export (not from this change)
- Acceptance criteria: all 7 met
