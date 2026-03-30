# Task: Final Four Scenario Simulator

**Story:** #83 from backlog.md
**Status:** done
**Branch:** feat/final-four-scenario-simulator

## Plan

- [x] Create scenario projection utility (compute full standings per scenario)
- [x] Create scenario summary utility (best/worst finish, win count per entry)
- [x] Create `ScenarioSimulatorCard` client component with summary + expandable detail views
- [x] Lift contention toggle state so it's shared between StandingsTable and ScenarioSimulatorCard
- [x] Wire into pool detail page (between Standings and What I Need)
- [x] Add unit tests for scenario projection and summary logic
- [x] Mobile responsive layout
- [x] Run pre-review checks

## Open Questions (Resolved)

1. **Contention toggle sharing** — Shared toggle: lifted topN to PoolStandingsSection wrapper
2. **Placement** — Between Standings and What I Need
3. **Entry display limit** — Show top 10 by default with "Show all" button

## Decisions

### Shared state via wrapper component

**Context:** The contention toggle (topN) needed to be shared between StandingsTable and ScenarioSimulatorCard
**Decision:** Created `PoolStandingsSection` client component that wraps both, owns topN state, and passes it down. Modified StandingsTable to accept optional `topN`/`onTopNChange` props (backward compatible).
**Alternatives considered:** React Context, URL search params, independent toggles

### Scenario card inside Standings Card vs. separate

**Context:** ScenarioSimulatorCard renders its own `<Card>`, so nesting inside Standings CardContent would create card-in-card
**Decision:** PoolStandingsSection renders both as sibling cards. Moved the Standings Card wrapper from the page into the section component.

## Changes Made

- `lib/scoring.ts`: Added `ProjectedStanding`, `ScenarioResult`, `ScenarioSummary` types. Added `projectScenarioStandings()`, `buildScenarioResults()`, `computeScenarioSummaries()`, `getScenarioLabel()` functions. Exported `Scenario` type. Two-pass ranking to mark all entries in a tie group with `tiedOnPoints`.
- `components/pool/standings-table.tsx`: Added optional `topN` and `onTopNChange` props for controlled mode (backward compatible). Updated bracket name links to persistent underline style for consistency.
- `components/pool/scenario-simulator-card.tsx`: New client component — summary table (best/worst finish, win count per topN) + expandable scenario detail with winner/loser team logos and projected standings. Shows top 10 entries by default with "Show all". Mobile: chevron on summary rows, current user highlight (`bg-primary/5`). Consistent underline on bracket links across desktop tables.
- `components/pool/pool-standings-section.tsx`: New client component — wraps StandingsTable + ScenarioSimulatorCard with shared topN state. Renders both Standings Card and Scenario Simulator Card as siblings.
- `app/(app)/pools/[id]/page.tsx`: Replaced standalone StandingsTable + Card with PoolStandingsSection. Passes `teamMap` for scenario labels/logos.
- `lib/scoring.test.ts`: Added tests for `buildScenarioResults` and `computeScenarioSummaries` (ties, topN levels, labels, projections).

## Verification

- Self-code review: done (2 rounds — first found tiedOnPoints bug + winner/loser badge enhancement; second clean)
- Format: run
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Knip: pass (only pre-existing `RoundPointsSummary` issue)
- Tests: pass (92/92)
- Acceptance criteria: all met

### Acceptance Criteria Verification

| Criterion                                                        | Status                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Appears on pool detail page after all E8 final, F4/Champ pending | Met — gated by `scenarioData` which uses `isFinalFourMode`              |
| Removed when Championship final                                  | Met — `isFinalFourMode` returns false when all late games are final     |
| Visible to all pool members (not user-specific)                  | Met — no user-specific filtering                                        |
| Scenario enumeration (8/4/2)                                     | Met — `generateScenarios` handles all combinations                      |
| Summary row per entry (best/worst finish, win count)             | Met — `computeScenarioSummaries` + `SummaryTable`                       |
| Expandable detail with standings and team logos                  | Met — `ScenarioDetail` with winner/loser badges and projected standings |
| Tied on points — tiebreaker TBD                                  | Met — `tiedOnPoints` flag on all entries in tie group                   |
| Contention toggle integration                                    | Met — shared `topN` state via `PoolStandingsSection`                    |
| Responsive desktop/mobile                                        | Met — separate layouts with `md:` breakpoints                           |
| Descriptive scenario labels                                      | Met — `getScenarioLabel` produces "X over Y" format                     |
