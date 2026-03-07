# Task: Create Bracket Pool

**Story:** #4 from backlog.md
**Status:** ready-for-review
**Branch:** feature/create-bracket-pool

## Plan

- [x] Add `pool` and `pool_member` tables to DB schema
- [x] Create Zod validator for pool creation form
- [x] Add query functions for creating pool + adding creator as leader
- [x] Create server action for pool creation
- [x] Create pool creation form UI at `/pools/create`
- [x] Add "Pools" nav link to app header
- [x] Verify all acceptance criteria

## Decisions

### Scoring columns on pool table

**Context:** Scoring defaults need to be stored per-pool for future customization (Story #14).
**Decision:** Store scoring as individual integer columns on the pool table (one per round) with defaults matching the spec. This keeps queries simple and avoids JSON parsing.
**Alternatives considered:** JSON column for scoring config (flexible but harder to query), separate scoring_config table (overkill for a fixed set of rounds).

### Pool member role enum

**Context:** Need to distinguish leaders from members.
**Decision:** Created a Postgres enum `pool_member_role` with values `leader` and `member`. Used on the `pool_member` table's `role` column.
**Alternatives considered:** Boolean `is_leader` column (less extensible if roles change), separate leaders join table (unnecessary complexity).

### Pool detail page included

**Context:** The create action redirects to `/pools/[id]` after success. Need a destination page.
**Decision:** Added a basic pool detail page that shows pool info and member count. This is minimal but functional — will be expanded in later stories.

## Changes Made

- `lib/db/pool-schema.ts`: New file — defines `pool` and `pool_member` tables with `poolMemberRoleEnum`, plus Drizzle relations
- `lib/db/schema.ts`: Re-exports pool schema tables and relations
- `lib/db/auth-schema.ts`: Added `poolMemberships` relation to user
- `lib/validators/pool.ts`: Zod schema for pool creation form (name, imageUrl, maxBracketsPerUser, maxParticipants)
- `lib/db/queries/pools.ts`: Query functions — `createPoolWithLeader` (transactional), `getPoolsByUserId`, `getPoolById`
- `app/(app)/pools/create/actions.ts`: Server action for pool creation with auth + validation, redirects to pool detail
- `app/(app)/pools/create/page.tsx`: Pool creation page with card layout
- `app/(app)/pools/create/create-pool-form.tsx`: Client form component with React Hook Form + Zod, displays default scoring
- `app/(app)/pools/page.tsx`: Pools listing page showing user's pools with create button
- `app/(app)/pools/[id]/page.tsx`: Pool detail page showing pool info, role, and member count
- `app/(app)/app-header.tsx`: Added "Pools" nav link

## Verification

- Tests: no test runner configured yet (no vitest setup)
- Build: pass
- Lint: pass
- Acceptance criteria:
  - [x] User specifies a pool name (required) and optional image URL
  - [x] User sets max brackets per user (default: 5, range: 1-10)
  - [x] User sets max participants (default: 50, range: 2-100)
  - [x] Default scoring settings are auto-populated (First Four: 0, R64: 1, R32: 2, S16: 4, E8: 8, F4: 16, Championship: 32)
  - [x] Creator becomes a pool leader (via `createPoolWithLeader` transaction)
  - [x] Pool visibility defaults to private (no public toggle implemented — design supports adding it later)
