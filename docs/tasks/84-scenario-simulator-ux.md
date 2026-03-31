# Task: Scenario Simulator UX Improvements

**Story:** #84 from backlog.md
**Status:** done
**Branch:** feat/scenario-simulator-ux

## Plan

- [x] Allow multiple scenario breakdowns to be open simultaneously
- [x] Give scenario simulator its own independent contention filter
- [x] Run pre-review

## Changes Made

- `components/pool/scenario-simulator-card.tsx`: Changed `expandedScenario` state from `number | null` to `Set<number>` so multiple scenarios can be expanded at once. Added local `topN` state and contention toggle UI so the filter is independent from standings.
- `components/pool/pool-standings-section.tsx`: Removed `topN` prop from `ScenarioSimulatorCard` since it now manages its own state.
- `components/pool/contention-toggle.tsx`: New shared component for the contention toggle (1st / Top 2 / Top 3), used by both standings and scenario simulator.
- `components/pool/standings-table.tsx`: Replaced inline contention toggle with shared `ContentionToggle` component.

## Verification

- Self-code review: done (no issues)
- Format: pass
- Lint: pass
- Build: pass
- Knip: pre-existing failure (unused `RoundPointsSummary` in `bracket-full-view.tsx`, unrelated)
- Tests: pass (92/92)
- Acceptance criteria: all met
