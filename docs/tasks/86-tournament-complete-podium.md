# Task: Tournament Complete — Top 3 Podium & Post-Tournament UX

**Story:** #86 from backlog.md
**Status:** done
**Branch:** tournament-complete-podium

## Plan

- [x] Add `isTournamentComplete()` helper to detect when all games are final
- [x] Create `TournamentPodium` component with gold/silver/bronze styling
- [x] Update `StandingsTable` — hide potential/status columns, add medal icons when complete
- [x] Update `PoolStandingsSection` — show podium above standings when complete
- [x] Update pool detail page — hide countdown, hide "What I Need", pass `tournamentComplete`
- [x] Update `BracketEntryRow` — hide potential points when complete
- [ ] Run `/pre-review` and address any issues

## Decisions

### Tournament completion detection

**Context:** No explicit "completed" status existed for tournaments.
**Decision:** Infer completion by checking if all tournament games have `status === "final"`. No schema change needed.
**Alternatives considered:** Adding an explicit `completed` field to the tournament table, or a manual admin toggle.

### Podium layout

**Context:** User wanted both a podium card and medal icons in the standings table.
**Decision:** Classic podium layout (2nd | 1st elevated | 3rd) on desktop, stacked list on mobile. Plus trophy medal icons in the standings table rows for top 3.
**Alternatives considered:** Podium only, or medals in table only.

### Hidden columns when complete

**Context:** Potential points equal actual points post-tournament, and elimination status is moot.
**Decision:** Hide Potential column, Status (elimination badge) column, and contention toggle when tournament is complete.
**Alternatives considered:** Keeping all columns for consistency.

## Changes Made

- `lib/db/queries/tournaments.ts`: Added `isTournamentComplete()` — checks if all games for a tournament have `status === "final"`
- `components/pool/tournament-podium.tsx`: **New** — Podium display for top 3 finishers with gold/silver/bronze theming, team logos, points, and links. Desktop podium layout + mobile stacked cards.
- `components/pool/standings-table.tsx`: Added `tournamentComplete` prop. Hides Potential column, Status column, and contention toggle when complete. Adds `RankMedal` (trophy icon with gold/silver/bronze color) for top 3 ranks.
- `components/pool/pool-standings-section.tsx`: Added `tournamentComplete` prop. Shows `TournamentPodium` above standings when complete. Renames header to "Final Standings". Hides scenario simulator.
- `app/(app)/pools/[id]/page.tsx`: Calls `isTournamentComplete()`. Hides countdown timer and "What I Need" card when complete. Passes `tournamentComplete` to child components.
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: Added `tournamentComplete` prop. Hides "potential" points display when complete.
- `app/globals.css`: Added `--medal-gold`, `--medal-silver`, `--medal-bronze` CSS variables (with bg and border variants) for both light and dark modes. Registered in `@theme inline` block.

## Verification

- Self-code review: done (2 issues found and fixed — hardcoded colors violated standards, mobile EliminationBadge missing `!tournamentComplete` guard)
- Format: pass
- Lint: pass (0 errors on changed files; pre-existing worktree noise in full repo lint)
- Build: pass
- Knip: pass (pre-existing `RoundPointsSummary` only)
- Test: pass (92/92)
- Acceptance criteria: all met
