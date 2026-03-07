# Task: Social Login

**Story:** #1 from backlog.md
**Status:** ready-for-review
**Branch:** feature/social-login

## Plan

- [x] Install `better-auth` and `unique-username-generator`
- [x] Configure Better Auth server with Google + Discord OAuth, Drizzle adapter
- [x] Generate and integrate Better Auth schema into Drizzle schema
- [x] Create auth client for client-side usage
- [x] Create auth API route handler
- [x] Add username generation on first login (using unique-username-generator)
- [x] Create login page with Google/Discord sign-in buttons
- [x] Create authenticated dashboard page with session check + redirect
- [x] Update env.ts and .env.example with auth env vars
- [x] Verify: build, lint, acceptance criteria

## Decisions

### No middleware for auth redirects

**Context:** Most pages need the session data anyway
**Decision:** Pages handle their own auth redirects via server-side session checks instead of Next.js middleware
**Alternatives considered:** Next.js middleware with `getSessionCookie` — rejected to avoid duplicate session fetching

### Username generation on first login

**Context:** OAuth providers don't provide usernames; Better Auth's username plugin is for email/password flows
**Decision:** Use `unique-username-generator` with email-based generation, retry until unique
**Alternatives considered:** Better Auth username plugin (not suited for OAuth-only), leaving username blank until profile setup

## Open Questions

- None

## Changes Made

- `lib/auth/index.ts`: Better Auth server config — Google + Discord social providers, Drizzle adapter, username auto-generation via databaseHooks
- `lib/auth/client.ts`: Client-side auth helper using `createAuthClient` from `better-auth/react`
- `lib/auth/username.ts`: Generates unique usernames from email using `unique-username-generator`, retries up to 10 times, falls back to timestamp suffix
- `lib/db/auth-schema.ts`: Auto-generated Better Auth schema (user, session, account, verification tables + relations)
- `lib/db/schema.ts`: Re-exports all auth schema tables (replaced placeholder health_check table)
- `lib/env.ts`: Added auth-related env var validation (BETTER*AUTH_URL, BETTER_AUTH_SECRET, GOOGLE*\_, DISCORD\_\_)
- `.env.example`: Added all auth env var placeholders with setup links
- `.env.local`: Added auth env var placeholders for local dev
- `app/api/auth/[...all]/route.ts`: Better Auth catch-all route handler
- `app/(auth)/login/page.tsx`: Login page with session check + redirect to dashboard if authenticated
- `app/(auth)/login/login-buttons.tsx`: Client component with Google and Discord sign-in buttons
- `app/(app)/dashboard/page.tsx`: Dashboard page with session check + redirect to login if unauthenticated
- `app/(app)/dashboard/sign-out-button.tsx`: Client component for signing out
- `app/page.tsx`: Root page redirects to dashboard (if authenticated) or login
- `components/ui/button.tsx`: Added via ShadCN CLI

## Verification

- Build: pass (warnings about missing OAuth credentials expected until configured)
- Lint: pass
- Format: pass
- Acceptance criteria:
  - [x] User can sign up / log in via Google OAuth — configured in Better Auth socialProviders
  - [x] User can sign up / log in via Discord OAuth — configured in Better Auth socialProviders
  - [x] On first login, profile auto-created with name, username, and profile picture from OAuth provider — databaseHooks.user.create generates username; Better Auth pulls name + image from provider
  - [x] Sessions managed securely via Better Auth — built-in session management with httpOnly cookies
  - [x] Unauthenticated users redirected to login — server-side session check in each page
