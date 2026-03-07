# Task: Manage Bracket Pool Settings

**Story:** #5 from backlog.md
**Status:** ready-for-review
**Branch:** feature/manage-pool-settings

## Plan

- [x] Add `buildUpdatePoolSchema` validator with dynamic min support
- [x] Add `POOL_LIMITS` shared constants for min/max/default values
- [x] Add query functions: `updatePool`, `getPoolMemberCount`, `getMaxBracketCountInPool`, `hasTournamentStarted`, `deletePool`
- [x] Add pool permissions module (`canPerformPoolAction`, `canAccessPoolPage`)
- [x] Create server action for updating pool settings (with upfront input validation)
- [x] Create server action for deleting pools (with leader permission check)
- [x] Create pool settings form component (reuse pattern from create form)
- [x] Create delete pool form component (matching account deletion confirmation pattern)
- [x] Add settings page at `/pools/[id]/settings` with page heading
- [x] Add settings link on pool detail page (visible to leaders only) with page heading
- [x] Add "Back to pools" link on pool detail page
- [x] Use `/bracket.webp` fallback for pools without an image URL
- [x] Fix number input coercion bug (valueAsNumber)
- [x] Run format, lint, build checks

## Decisions

### Dynamic validation minimums

**Context:** Max brackets per user cannot be set below current highest bracket count; max participants cannot go below current member count.
**Decision:** `buildUpdatePoolSchema` takes `currentMemberCount` and `maxBracketCountInPool` as parameters and uses `Math.max()` to set dynamic minimums. Server action re-validates with fresh counts to prevent race conditions.
**Alternatives considered:** Static schema with separate validation logic (more code, less cohesive).

### Tournament lock as placeholder

**Context:** Story #6 (Sports Data Sync) hasn't been built yet, so there's no game data to check.
**Decision:** Added `hasTournamentStarted()` that returns `false` with a TODO. The settings page checks this and shows a locked message when true. Server action also checks before allowing updates.
**Alternatives considered:** Skip the lock entirely for now (would miss the acceptance criteria pattern).

### Bracket count placeholder

**Context:** Story #8 (Create Bracket Entry) hasn't been built yet, so there are no bracket entries to count.
**Decision:** Added `getMaxBracketCountInPool()` that returns `0` with a TODO. Will be implemented when bracket entries exist.

### Pool permissions module

**Context:** Role checks were inline (e.g., `role !== "leader"`). Needed a centralized, extensible approach.
**Decision:** Created `lib/permissions/pools.ts` with `Record<Action, Set<Role>>` maps and helper functions `canPerformPoolAction` and `canAccessPoolPage`. Easy to extend as new stories add actions/pages.
**Alternatives considered:** Keep inline role checks (scattered, harder to audit).

### Shared pool limit constants

**Context:** Min/max/default values for brackets per user and participants were duplicated across validators and form components.
**Decision:** Created `POOL_LIMITS` const in `lib/validators/pool.ts` with `{ min, max, default }` for each field. All validators and forms reference these.
**Alternatives considered:** Separate constants file (unnecessary indirection for two values).

## Changes Made

- `lib/validators/pool.ts`: Added `POOL_LIMITS` shared constants; `createPoolSchema` and `buildUpdatePoolSchema` reference them; added `UpdatePoolFormValues` type
- `lib/permissions/pools.ts`: New file — permission maps and helpers for pool actions (`update-settings`, `delete-pool`) and pages (`detail`, `settings`)
- `lib/db/queries/pools.ts`: Added `updatePool`, `deletePool`, `getPoolMemberCount`, `getMaxBracketCountInPool` (placeholder), `hasTournamentStarted` (placeholder)
- `app/(app)/pools/[id]/settings/actions.ts`: New file — server actions `updatePoolSettings` (with upfront Zod input validation) and `deletePoolAction`, both using permission helpers
- `app/(app)/pools/[id]/settings/pool-settings-form.tsx`: New file — client form component with dynamic min constraints, `POOL_LIMITS`, image preview with fallback
- `app/(app)/pools/[id]/settings/delete-pool-form.tsx`: New file — DELETE confirmation form matching account deletion pattern
- `app/(app)/pools/[id]/settings/page.tsx`: New file — settings page restricted to leaders, shows locked state when tournament started, includes delete form, page heading with pool name
- `app/(app)/pools/[id]/page.tsx`: Added "Settings" button (permission-gated), "Back to pools" link, page heading, fallback pool image
- `app/(app)/pools/create/create-pool-form.tsx`: Uses `POOL_LIMITS`, `valueAsNumber` fix, fallback image preview
- `app/(app)/pools/page.tsx`: Fallback pool image on pool cards

## Verification

- Tests: no test runner configured yet
- Format: run
- Lint: pass (zero errors, zero warnings)
- Build: pass
- Acceptance criteria:
  - [x] All creation-time settings can be edited before the tournament starts
  - [x] Max brackets per user cannot be set below the current highest bracket count of any user in the pool
  - [x] Max participants cannot be set below the current member count
  - [x] Only pool leaders can edit settings
  - [x] Editing is locked once tournament games begin
