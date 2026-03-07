# Ways of Working — Claude Code

How Claude Code operates on this project. Follow this process for every task.

---

## 1. Task Tracking

Before starting work, create or update a task file at `docs/tasks/<story-number>-<short-name>.md`.

```markdown
# Task: <Story title>

**Story:** #<number> from backlog.md
**Status:** in-progress | ready-for-review | done
**Branch:** <branch-name>

## Plan

- [ ] Step 1
- [ ] Step 2
- ...

## Open Questions

- ...

## Changes Made

- <file>: <what changed and why>
```

Update the checklist and "Changes Made" section as you go. This is the single source of truth for progress.

---

## 2. Implementation Decision Log

Record non-obvious decisions in the task file under a `## Decisions` section.

```markdown
## Decisions

### <Short title>

**Context:** Why this came up
**Decision:** What was chosen
**Alternatives considered:** What else was evaluated
```

Keep entries short. Only log decisions where the "why" isn't obvious from the code.

---

## 3. Pre-Review Checklist

Before marking a task `ready-for-review`, run the following commands and fix any issues:

1. `pnpm format` — auto-format all files with Prettier
2. `pnpm lint` — must pass with zero errors and zero warnings
3. `pnpm build` — must compile with zero TypeScript errors

Then verify:

- [ ] All acceptance criteria from `docs/business/backlog.md` are met
- [ ] Code follows `docs/technical/standards.md`
- [ ] No unrelated changes included
- [ ] New/changed functionality has tests
- [ ] Existing tests still pass (`pnpm test` or equivalent)
- [ ] `pnpm format` has been run
- [ ] `pnpm lint` passes with zero errors/warnings
- [ ] `pnpm build` compiles without errors

Add the results to the task file:

```markdown
## Verification

- Tests: pass/fail (details)
- Format: run
- Lint: pass/fail
- Build: pass/fail
- Acceptance criteria: all met / <list gaps>
```

---

## 4. Automated Review Setup

A separate Claude Code agent can review work by following this prompt pattern:

> Read `docs/tasks/<task-file>.md` to understand what was done.
> Read `docs/business/backlog.md` story #N for acceptance criteria.
> Read `docs/technical/standards.md` for code standards.
> Review all files listed in "Changes Made" against the criteria and standards.
> Report: criteria coverage, standards violations, test gaps, and suggestions.

The reviewer agent should not modify code — only produce a review report.

---

## 5. Human Review

After automated checks pass and the task is marked `ready-for-review`:

1. Claude Code summarizes what was done, key decisions, and anything needing human judgment
2. Human reviews the diff, task file, and any flagged items
3. Human approves, requests changes, or asks questions in the Claude Code session
4. Claude Code addresses feedback and updates the task file

Do not merge or mark `done` without human approval.

---

## 6. Feedback Loop

When feedback is given during a Claude Code session (corrections, preferences, patterns to follow or avoid):

1. **Standards** — If feedback reflects a general coding standard, update `docs/technical/standards.md`
2. **Domain knowledge** — If feedback clarifies business rules or intent, update `docs/business/originalVision.md` or `docs/business/backlog.md` as appropriate
3. **Ways of working** — If feedback changes this process, update this file
4. **CLAUDE.md** — If feedback is a persistent instruction for Claude Code behavior, update `CLAUDE.md`

Always confirm with the user before modifying existing docs. Note what was updated in the task file under a `## Doc Updates` section.

---

## Quick Reference

| What                   | Where                            |
| ---------------------- | -------------------------------- |
| Task progress          | `docs/tasks/<task>.md`           |
| Acceptance criteria    | `docs/business/backlog.md`       |
| Code standards         | `docs/technical/standards.md`    |
| Architecture decisions | Task file `## Decisions` section |
| Process rules          | This file                        |
