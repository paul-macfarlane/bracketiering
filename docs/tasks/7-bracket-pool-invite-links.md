# Task: Bracket Pool Invite Links

**Story:** #7 from backlog.md
**Status:** ready-for-review
**Branch:** feature/pool-invite-links

## Plan

- [x] Add `poolInvite` table to schema (code, poolId, createdBy, expiresAt, maxUses, useCount, role)
- [x] Export new schema from schema index
- [x] Add invite-related DB queries (create, validate, redeem, list, delete)
- [x] Add invite validator (Zod schema for creating invites)
- [x] Update permissions (who can create/manage invites)
- [x] Create server actions for invite CRUD
- [x] Add invite management UI on pool detail page (generate link, view active invites)
- [x] Create public invite acceptance route (`/invite/[code]`)
- [x] Update login page to support callbackUrl for post-auth redirect
- [x] Run format, lint, build checks

## Acceptance Criteria (from backlog)

- [x] Only pool leaders can generate and manage shareable invite links
- [x] Invite link has a configurable expiration (default: 7 days)
- [x] Invite link has configurable max uses (default: remaining pool capacity)
- [x] Invite link can specify a role for joiners (member or leader)
- [x] Expired or maxed-out links show an appropriate error
- [x] Users who follow a valid link and are authenticated are added to the pool

## Changes Made

- `lib/db/pool-schema.ts`: Added `poolInvite` table with code, poolId, createdBy, role, maxUses, useCount, expiresAt. Added relations.
- `lib/db/schema.ts`: Exported poolInvite and poolInviteRelations
- `lib/db/queries/pool-invites.ts`: CRUD queries + transactional `redeemPoolInvite` with capacity/expiry/duplicate checks
- `lib/db/migrations/0002_special_christian_walker.sql`: Migration for pool_invite table
- `lib/validators/pool-invite.ts`: Zod schema for invite creation (role, expirationDays, maxUses)
- `lib/permissions/pools.ts`: Added create-invite and delete-invite actions (both leader+member)
- `app/(app)/pools/[id]/invites/actions.ts`: Server actions for creating and deleting invites
- `app/(app)/pools/[id]/invites/create-invite-dialog.tsx`: Dialog form for generating invite links with copy-to-clipboard
- `app/(app)/pools/[id]/invites/invite-list.tsx`: List of active invites with status badges and delete
- `app/(app)/pools/[id]/page.tsx`: Added InviteList section with server-side data loading
- `app/(app)/invite/[code]/page.tsx`: Public invite page with error states for invalid/expired/maxed invites
- `app/(app)/invite/[code]/invite-accept-card.tsx`: Client component for accepting invite
- `app/(app)/invite/[code]/actions.ts`: Server action for accepting invite
- `app/(auth)/login/page.tsx`: Added callbackUrl support for post-auth redirect
- `app/(auth)/login/login-buttons.tsx`: Pass callbackUrl to OAuth provider
- `components/ui/dialog.tsx`, `select.tsx`, `badge.tsx`: New shadcn components

## Verification

- Format: run
- Lint: pass (0 errors, 0 warnings)
- Build: pass
- Acceptance criteria: all met
