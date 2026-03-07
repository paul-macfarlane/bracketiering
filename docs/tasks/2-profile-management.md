# Task: Profile Management

**Story:** #2 from backlog.md
**Status:** ready-for-review
**Branch:** feature/profile-management

## Plan

- [x] Install ShadCN components (form, input, label, card, avatar, sonner, dropdown-menu, sheet, separator)
- [x] Install zod and @hookform/resolvers
- [x] Create Zod validation schema for profile updates (`lib/validators/profile.ts`)
- [x] Create DB query functions for user profile (`lib/db/queries/users.ts`)
- [x] Create server action for profile update (`app/(app)/profile/actions.ts`)
- [x] Build profile page with edit form (`app/(app)/profile/page.tsx`)
- [x] Add Sonner toast provider to root layout
- [x] Add app layout with auth check and header (`app/(app)/layout.tsx`)
- [x] Add app header with top nav, user dropdown, and mobile hamburger menu (`app/(app)/app-header.tsx`)
- [x] Simplify dashboard and profile pages (auth handled by layout)
- [x] Remove unused sign-out-button component
- [x] Verify: build, lint, acceptance criteria

## Decisions

### Form validation approach

**Context:** Zod v4 transforms change the inferred output type, causing type mismatches with React Hook Form
**Decision:** Keep the schema simple (no transforms), handle empty string to null conversion in the server action
**Alternatives considered:** Separate input/output types with z.input/z.output — added complexity for no benefit

### Server action for mutations

**Context:** Standards say prefer Server Actions for mutations
**Decision:** Used a server action (`updateProfile`) that validates with Zod, checks username uniqueness, and updates via query function
**Alternatives considered:** API route — unnecessary for a simple form submission

### Username uniqueness on the server

**Context:** Username must be unique; need to show validation error if taken
**Decision:** Server action checks uniqueness via `isUsernameTaken` query and returns error; client form sets field-level error on username field
**Alternatives considered:** Unique constraint at DB level only — wouldn't give a friendly error message

### App layout with shared header

**Context:** Need consistent navigation across authenticated pages
**Decision:** Created `app/(app)/layout.tsx` that handles auth check + renders a shared header. Top nav with logo, nav links, and user dropdown (desktop) / hamburger sheet menu (mobile). Individual pages no longer need auth checks.
**Alternatives considered:** Sidebar nav — deferred since few pages exist; can revisit as more features land

## Open Questions

- None

## Changes Made

- `app/(app)/layout.tsx`: Shared app layout — auth check with redirect, renders header + main content area
- `app/(app)/app-header.tsx`: App header — logo linking to dashboard, nav links, user avatar dropdown (desktop) with profile/sign-out, hamburger sheet menu (mobile) with user info, nav links, profile, and sign-out
- `app/(app)/dashboard/page.tsx`: Simplified — removed auth check (layout handles it), removed inline profile link and sign-out button
- `app/(app)/dashboard/sign-out-button.tsx`: Removed — sign out now in header
- `app/(app)/profile/page.tsx`: Simplified — removed auth check (layout handles it)
- `app/(app)/profile/profile-form.tsx`: Removed "Back" button (header provides navigation)
- `lib/validators/profile.ts`: Zod schema for profile form — validates name (1-100 chars), username (3-30 chars, alphanumeric/hyphens/underscores), and image (valid URL or empty string)
- `lib/db/queries/users.ts`: Database query functions — `getUserById`, `isUsernameTaken` (excludes current user), `updateUserProfile`
- `app/(app)/profile/actions.ts`: Server action `updateProfile` — validates input, checks username uniqueness, persists changes
- `app/layout.tsx`: Added Sonner `<Toaster>` for toast notifications
- `components/ui/form.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `separator.tsx`: Added via ShadCN CLI
- `components/ui/input.tsx`, `label.tsx`, `card.tsx`, `avatar.tsx`, `sonner.tsx`: Added via ShadCN CLI
- `package.json`: Added zod, @hookform/resolvers, sonner dependencies

## Verification

- Build: pass
- Lint: pass
- Acceptance criteria:
  - [x] User can update their display name — name field with validation
  - [x] User can update their username (must be unique; show validation error if taken) — username field with server-side uniqueness check, field-level error display
  - [x] User can update their profile picture URL — image URL field with live avatar preview
  - [x] Changes persist immediately — server action updates DB, router.refresh() revalidates
