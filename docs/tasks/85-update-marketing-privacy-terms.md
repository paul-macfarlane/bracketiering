# Task: Update Marketing Page, Privacy Policy & Terms of Service

**Story:** #85 from backlog.md
**Status:** done
**Branch:** feat/update-marketing-privacy-terms

## Plan

- [x] Ask clarifying questions and align on approach
- [x] Add new feature highlights to marketing page (scenario simulator, elimination, What I Need, etc.)
- [x] Update comparison table with new differentiators
- [x] Update JSON-LD featureList
- [x] Update stats-based generation section copy if needed (new presets)
- [x] Review privacy policy — no changes needed
- [x] Review terms of service — no changes needed
- [x] Run pre-review checks

## Open Questions

1. ~~Marketing page structure~~ — **Resolved: (A)** Separate "Tournament Experience" section for during-tournament features
2. ~~Scenario simulator spotlight~~ — **Resolved:** Own dedicated section with visual mock
3. ~~Comparison table~~ — **Resolved:** Yes, add scenario simulator and elimination tracking rows

## Decisions

### Section order

**Context:** Need to integrate new sections into existing page flow
**Decision:** Stats highlight → Existing features → Scenario simulator spotlight → Tournament Experience section → How it works. This flows setup → tournament → getting started.
**Alternatives considered:** Putting scenario simulator before existing features, but it makes more sense after the setup-focused features.

## Changes Made

- `app/page.tsx`: Added scenario simulator spotlight section with visual preview mock, "Tournament Experience" section with 6 feature cards (elimination tracking, rooting guide, standings movement, potential points, bracket lines, champion tracking), 2 new comparison table rows (scenario simulator, elimination tracking), updated JSON-LD featureList, updated stats presets copy
- `docs/business/backlog.md`: Added Story #85

## Verification

- Self-code review: done (no issues found)
- Format: clean
- Lint: pass
- Build: pass
- Knip: pre-existing issue only (`RoundPointsSummary` in `bracket-full-view.tsx` — not related)
- Tests: 92 passed, 0 failed
- Acceptance criteria: all met
