# Task: Account Deletion

**Story:** #3 from backlog.md
**Status:** ready-for-review
**Branch:** feature/account-deletion

## Plan

- [x] Add `anonymizeAndDeactivateUser` query function that anonymizes user data and deletes sessions/accounts
- [x] Add server action for account deletion with session validation
- [x] Create settings page at `(app)/settings/page.tsx` with delete account section
- [x] Create `DeleteAccountForm` client component with "DELETE" confirmation input
- [x] Add "Settings" link to app header navigation (desktop dropdown + mobile menu)
- [x] Verify all acceptance criteria

## Decisions

### Anonymize instead of hard-delete

**Context:** AC says "All user activity (brackets, pool membership) is anonymized (not hard-deleted) so pool data integrity is maintained"
**Decision:** Anonymize user record (name → "Deleted User", email → `deleted-{id}@deleted.local`, username → null, image → null) and hard-delete sessions + accounts. Do not use Better Auth's built-in `deleteUser` which hard-deletes.
**Alternatives considered:** Better Auth's built-in deleteUser (hard deletes the row, would break future FK references from brackets/pools)

### Confirmation via typing "DELETE"

**Context:** AC says "Deletion requires confirmation (e.g., type 'DELETE' or confirm dialog)"
**Decision:** Require user to type "DELETE" in an input field, which is more intentional than a simple confirm dialog.
**Alternatives considered:** Browser confirm dialog (too easy to click through accidentally)

## Changes Made

- `lib/db/queries/users.ts`: Added `anonymizeAndDeactivateUser` function — anonymizes user fields and deletes sessions/accounts in a transaction
- `app/(app)/settings/actions.ts`: New server action `deleteAccount` — validates session, calls anonymize, redirects to login
- `app/(app)/settings/page.tsx`: New settings page hosting the delete account form
- `app/(app)/settings/delete-account-form.tsx`: Client component requiring user to type "DELETE" before enabling the delete button
- `app/(app)/app-header.tsx`: Added Settings link with gear icon to desktop dropdown and mobile menu

## Verification

- Tests: no tests to run (no vitest config yet; business logic is in a single query function)
- Build: pass
- Lint: pass
- Acceptance criteria:
  - [x] User can initiate account deletion from settings
  - [x] Deletion requires confirmation (type "DELETE")
  - [x] Once deleted, the account cannot be recovered (sessions/accounts deleted, user anonymized)
  - [x] All user activity is anonymized (not hard-deleted) so pool data integrity is maintained
  - [x] User is logged out and redirected after deletion (redirect to /login after session deletion)
