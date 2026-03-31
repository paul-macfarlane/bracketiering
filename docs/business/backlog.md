# Bracketsball Backlog

Derived from [Original Vision](./originalVision.md). Items are organized by epic and priority. All MVP epics come first, followed by non-MVP epics at the end.

---

## Epic: Tech Stack Setup

### 0. Tech Stack Setup (MVP) ✅

**As a** developer, **I want to** set up the core tech stack **so that** I have a working local development environment to build features on.

**Acceptance Criteria:**

- Local Postgres 17 runs via Docker Compose
- Drizzle ORM is installed and configured to connect to local Postgres
- Drizzle Kit is available for migrations and schema management
- ShadCN UI is initialized with Tailwind CSS
- React Hook Form is installed
- `pnpm dev` starts Next.js with a working connection to the local database
- `pnpm db:push` (or equivalent) applies Drizzle schema to the local database
- README or docs include instructions for getting started locally

---

## Epic: Auth

### 1. Social Login (MVP) ✅

**As a** user, **I want to** sign up and log in with Google or Discord **so that** I can quickly access the app without creating a new password.

**Acceptance Criteria:**

- User can sign up / log in via Google OAuth
- User can sign up / log in via Discord OAuth
- On first login, a profile is auto-created with name, username, and profile picture pulled from the OAuth provider
- Sessions are managed securely via Better Auth
- Unauthenticated users are redirected to login

---

## Epic: Profile

### 2. Profile Management (MVP) ✅

**As a** user, **I want to** edit my username, name, and profile picture URL **so that** I can personalize my identity in the app.

**Acceptance Criteria:**

- User can update their display name
- User can update their username (must be unique; show validation error if taken)
- User can update their profile picture URL
- Changes persist immediately

---

## Epic: Account

### 3. Account Deletion (MVP) ✅

**As a** user, **I want to** delete my account **so that** my data is removed from the platform.

**Acceptance Criteria:**

- User can initiate account deletion from settings
- Deletion requires confirmation (e.g., type "DELETE" or confirm dialog)
- Once deleted, the account cannot be recovered
- All user activity (brackets, pool membership) is anonymized (not hard-deleted) so pool data integrity is maintained
- User is logged out and redirected after deletion

---

## Epic: Pools Setup

### 4. Create Bracket Pool (MVP) ✅

**As a** user, **I want to** create a bracket pool **so that** my friends and I can compete.

**Acceptance Criteria:**

- User specifies a pool name (required) and optional image URL
- User sets max brackets per user (default: 5, range: 1-10)
- User sets max participants (default: 50, range: 2-100)
- Default scoring settings are auto-populated:
  - First Four: 0 pts
  - Round of 64: 1 pt
  - Round of 32: 2 pts
  - Sweet 16: 4 pts
  - Elite 8: 8 pts
  - Final Four: 16 pts
  - Championship: 32 pts
- Creator becomes a pool leader
- Pool visibility defaults to private (design should support public toggle later)

### 5. Manage Bracket Pool Settings (MVP) ✅

**As a** pool leader, **I want to** edit pool settings **so that** I can adjust the pool before games start.

**Acceptance Criteria:**

- All creation-time settings can be edited before the tournament starts
- Max brackets per user cannot be set below the current highest bracket count of any user in the pool
- Max participants cannot be set below the current member count
- Only pool leaders can edit settings
- Editing is locked once tournament games begin

---

## Epic: Sports Data

### 6a. Admin Tournament Management (MVP) ✅

**As an** admin, **I want to** manage teams, tournaments, and game data via an admin UI **so that** tournament data can be entered and corrected manually, serving as both a primary data entry method for testing and a fallback/override for automated sync.

**Acceptance Criteria:**

- Users have an `appRole` field (default: "user", can be set to "admin" via database)
- Admin-only routes are protected — non-admin users are redirected
- Admin can CRUD teams (name, short name, abbreviation, logo URL)
- Admin can CRUD tournaments (name, year, active status); only one tournament can be active at a time
- Admin can assign teams to a tournament with seed and region
- Admin can manage tournament games (create matchups, set round/region, assign teams)
- Admin can update game results (scores, status: scheduled/in_progress/final)
- Admin can advance winners to the next round
- Seed scripts exist to populate 68 real 2025 NCAA tournament teams and a mock tournament bracket for testing
- Data model supports: persistent teams, tournaments, tournament_team assignments, tournament games with bracket tree structure (source game references)

### 6b. ESPN Data Sync (MVP — separate implementation) ✅

**As the** system, **I need to** sync live tournament data from ESPN **so that** brackets are scored automatically without manual data entry.

**Acceptance Criteria:**

- Sync bracket/game structure (regions, seeds, matchups) from ESPN scoreboard API
- Sync team info (name, seed, logo/abbreviation)
- Sync game scoring (team scores, game status)
- Sync game schedule (date, time, location)
- Data source: ESPN hidden API (see [research doc](../technical/sports-data-source-research.md))
- Sync runs on a scheduled cron (via cron-job.org)
- Handles in-progress, completed, and upcoming game states
- Built behind an adapter interface so NCAA API can be swapped in as backup
- Admin UI can override any synced data

---

## Epic: Pool Members

### 7. Bracket Pool Invite Links (MVP) ✅

**As a** pool member, **I want to** share an invite link **so that** others can join my pool.

**Acceptance Criteria:**

- Only pool leaders can generate and manage shareable invite links
- Invite link has a configurable expiration (default: 7 days)
- Invite link has configurable max uses (default: remaining pool capacity)
- Invite link can specify a role for joiners (member or leader)
- Expired or maxed-out links show an appropriate error
- Users who follow a valid link and are authenticated are added to the pool

### 8. Manage Pool Members (MVP) ✅

**As a** pool leader, **I want to** manage pool members' roles and remove members **so that** I can control who participates in my pool.

**As a** pool member, **I want to** view the member list and leave a pool **so that** I can see who I'm competing with and opt out if I choose.

**Acceptance Criteria:**

- All pool members can view the full member list (name, role)
- Pool leaders can change a member's role between "member" and "leader"
- Pool leaders can remove any member (including other leaders and the original pool creator)
- Removing a member hard-deletes all of their bracket entries from the pool
- Removal requires a confirmation dialog
- Regular members cannot edit roles or remove other members
- Any member (including leaders) can leave a pool voluntarily
  - Leaving hard-deletes all of the member's bracket entries from the pool
  - Members are warned that their brackets will be removed before confirming
  - A leader cannot leave if they are the last leader in the pool — they must promote another member to leader first
  - If a member is the only person in the pool, leaving deletes the pool entirely
- Only pool leaders see role edit and remove controls in the UI

---

## Epic: Bracket Creation

### 9. Create Bracket Entry (MVP) ✅

**As a** pool member, **I want to** create a bracket entry with my tournament picks **so that** I can compete in the pool.

**Acceptance Criteria:**

- User can create a new bracket entry if they haven't hit the pool's max bracket limit
- Bracket entry has a user-defined name
- UI presents the full tournament bracket for picking game winners
- Each pick auto-saves so progress is not lost
- User must also enter a tiebreaker (predicted total score of the championship game)
- Only brackets with all games picked and a tiebreaker entered can be submitted
- Incomplete brackets are clearly indicated as drafts

### 10. Edit Bracket Entry (MVP)

**As a** pool member, **I want to** edit my bracket entry **so that** I can change my picks before the tournament starts.

**Acceptance Criteria:**

- All picks and tiebreaker can be modified before tournament games begin
- Same auto-save behavior as creation
- Editing is locked once the tournament starts

---

## Epic: Bracket Visibility

### 11. View Own Brackets (MVP) ✅

**As a** user, **I want to** view a list of my brackets within a pool **so that** I can track my performance.

**Acceptance Criteria:**

- User sees a list of their bracket entries in the pool detail page with current points and potential remaining points (after tournament starts)
- User can click into an individual bracket for detail
- Pool standings page shows all brackets including the user's own

### 12. View Other Members' Brackets (MVP) ✅

**As a** pool member, **I want to** view other members' brackets **so that** I can see how my competition is doing.

**Acceptance Criteria:**

- User can view any other member's bracket within a shared pool (read-only)
- Same summary info shown: bracket name, current points, potential remaining points
- Accessible via pool standings page links

### 13. View Pool Standings (MVP) ✅

**As a** pool member, **I want to** see the pool standings **so that** I know where I rank.

**Acceptance Criteria:**

- Standings show all brackets in the pool ordered by: points (desc), then potential points (desc), then tiebreaker accuracy, then alphabetical (asc)
- Each row shows: rank, bracket name, owner (with avatar), champion pick (team logo), current points, potential remaining points
- User can click into any bracket for detail

### 14. View Individual Bracket Detail (MVP) ✅

**As a** user, **I want to** view an individual bracket in detail **so that** I can see every pick and its outcome.

**Acceptance Criteria:**

- Full bracket view showing all rounds and picks
- Each pick shows: teams, winner selected, actual result (if game is played)
- Visual indicators for correct picks, incorrect picks, and pending games
- Points earned per pick are visible
- Any pool member can view any bracket in the pool (read-only for non-owners)

---

## Epic: Scoring & Standings

### 15. Live Bracket Scoring & Standings (MVP) ✅

**As a** pool member, **I want** bracket standings to update automatically as game results are recorded **so that** I can track how I and others are performing in real time.

**Acceptance Criteria:**

- [x] When game results are synced from ESPN, all bracket entries have their scores recalculated automatically
- [x] When an admin manually edits a game result, standings are NOT auto-recalculated — the admin uses the separate "Sync Standings" button to trigger recalculation on demand (intentional: allows batch manual edits without repeated recalculation)
- [x] Each pick is scored based on the pool's round-based scoring settings
- [x] Pool standings reflect current scores and are viewable by all pool members
- [x] Potential remaining points are calculated for each bracket entry (max points still achievable)
- [x] Standings are ordered by: points (desc), potential points (desc), tiebreaker accuracy, then alphabetical
- [x] Architecture decision: admin-triggered batch sync stores `totalPoints` and `potentialPoints` on `bracketEntry` table for fast reads

**Additional work completed in this PR:**

- Bracket view shows correct/incorrect pick indicators (green/red) with points earned per pick
- Bracket view header shows live "Points: X | Potential: Y" summary
- Success/failure CSS variables added to design system
- Create bracket and create invite locked after tournament starts (backend + UI)
- Mobile navigation affordance on bracket list items

---

## Epic: Tournament Lock

### 46. Bracket Lock at Round of 64 Start (MVP) ✅

**As a** user, **I want** all bracket creation, editing, pool management, and invite functionality to lock when the Round of 64 begins **so that** the competition is fair and mirrors how real bracket challenges work.

**Acceptance Criteria:**

- **Lock deadline stored on tournament:** Add a `bracketLockTime` field to the tournament table, representing the scheduled start time of the first Round of 64 game
  - This time is auto-calculated from game schedule data (earliest R64 game `startTime`) during ESPN sync
  - Admin can manually override the lock time via the admin UI
- **Global app-wide lock:** Once the current time passes `bracketLockTime`, the following actions are blocked (backend enforcement + UI indicators):
  - Creating or editing bracket entries (picks and tiebreaker)
  - Submitting or unsubmitting brackets
  - Deleting brackets
  - Auto-filling or clearing bracket picks
  - Creating pools or editing pool settings (name, scoring, max brackets, max participants)
  - Creating invite links or sending in-app invites
  - Joining pools (via invite link or public search)
- **First Four is NOT locked:** Users can still create/edit brackets while First Four games are in progress — the lock only applies at the R64 scheduled start time
- **Draft brackets at lock time:** Unsubmitted (draft) brackets remain visible but are permanently locked as incomplete — they cannot earn points or appear in standings. Users must submit before the deadline for their bracket to be eligible
- **Countdown timer UI:** Display a countdown to the lock deadline on bracket creation/editing pages and pool detail pages so users know when the deadline is
  - Shows days, hours, minutes remaining
  - After lock, displays "Brackets are locked" instead of countdown
- **Admin override:** Admin can manually adjust the `bracketLockTime` via the admin tournament UI (e.g., if the tournament start is delayed)
- **Replace existing lock logic:** The current `hasTournamentStarted()` function (which checks if any game has moved off "scheduled" status) is replaced with a time-based check against `bracketLockTime`

---

## Epic: Pre-Tournament Setup

### 34. Configure ESPN Sync Cron Jobs (MVP) ✅ — Epic: Pre-Tournament Setup

**As the** product owner, **I want to** set up the cron jobs on cron-job.org for ESPN data sync **so that** tournament data syncs automatically once games begin.

**Acceptance Criteria:**

- Cron jobs configured on cron-job.org to hit the ESPN sync endpoint(s) on an appropriate schedule
- Sync frequency is suitable for live tournament updates (e.g., every few minutes during game days)
- Verify sync works end-to-end in production before the tournament starts

### 39. Validate Cron Sync Performance (MVP) ✅ — Epic: Pre-Tournament Setup

**As the** product owner, **I want to** validate that the ESPN sync cron job completes well within a 30-second timeout **so that** syncs don't fail or get killed mid-transaction in production.

**Acceptance Criteria:**

- **Audit the sync endpoint (`/api/sync-espn`)** for total execution time under realistic conditions:
  - Scoreboard fetch from ESPN API (single date vs. multi-date scenarios)
  - DB transaction: team upserts, game matching/updates, winner advancement
  - Post-sync standings recalculation across all pools
- **Measure or estimate wall-clock time** for each phase of the sync under peak load (e.g., R64 day with 16 games in progress, multiple pools with many bracket entries)
- **Address the multi-date fetch bottleneck**: the current 500ms delay between date fetches in `espn-adapter.ts` means a 2-day R64 window adds 500ms+ overhead — verify this is acceptable or optimize
- **Verify standings recalc scales**: `syncStandingsForTournament()` runs after every sync — confirm it completes quickly with realistic pool/bracket counts
- **Confirm team stats sync is NOT called by the cron endpoint** (it runs separately via admin UI and takes ~20-30s on its own for 68 teams — must never be bundled into the cron)
- **Add logging or timing instrumentation** to the sync endpoint so execution time can be monitored in production (e.g., log total duration and phase durations)
- **Document any optimizations made** and the expected sync duration under various tournament phases
- **Set Vercel function `maxDuration`** on the sync route if needed to ensure adequate timeout (Vercel Pro allows up to 300s, but target < 30s)

### 32. Update External Services Branding (MVP) ✅ — Epic: Branding

**As the** product owner, **I want to** update the app name, icons, and metadata across all external services **so that** the Bracketsball brand is consistent everywhere.

**Acceptance Criteria:**

- Google Cloud Console: Update OAuth consent screen app name to "Bracketsball", upload app icon (`icon-512.png`)
- Discord Developer Portal: Update application name to "Bracketsball", upload app icon (`icon-512.png`)
- Vercel: Update project name/display name to "Bracketsball"
- GitHub: Update repository description to reflect new name
- Neon: Update project name/description if applicable
- cron-job.org: Update job names/descriptions to reflect new name
- Verify OAuth consent screens show correct name and icon for both Google and Discord flows

---

## Non-MVP Stories (Prioritized)

Stories below are ordered by priority. Completed stories are grouped at the end.

---

### 47. Filter Pool Data by Active Tournament (Non-MVP) ✅ — Epic: Multi-Season Support

**As a** pool member, **I want** my pool's bracket list and related data to only show entries for the current active tournament **so that** I don't see stale brackets from previous tournaments when a new season starts.

**Acceptance Criteria:**

- **Bracket list on pool detail page** filters bracket entries by the active tournament — entries from previous tournaments are not shown
- **Bracket count checks** (e.g., "you have X of Y allowed brackets") only count entries for the active tournament, so users can create new brackets for the new tournament even if they had entries in previous ones
- **All pool-scoped bracket queries** that currently filter by `poolId` alone are audited and updated to also filter by `tournamentId` where appropriate (e.g., `getBracketEntriesByPoolAndUser`)
- **Standings already work correctly** — `getPoolStandings()` already filters by both `poolId` and `tournamentId`, so no change needed there
- **No data deletion** — previous tournament bracket entries remain in the database; they are simply not displayed in the current tournament view
- **Future-compatible** — the approach should not preclude adding historical tournament views to pools later (e.g., a "Past Seasons" tab)

### 48. Direct Invite Role Selection (Non-MVP) ✅ — Epic: Pool Members

**As a** pool leader, **I want to** specify the role (member or leader) when sending a direct user invite **so that** I can invite someone directly as a leader without having to change their role after they join.

**Acceptance Criteria:**

- When sending a direct user invite, the leader can choose whether the invitee will join as "member" (default) or "leader"
- The selected role is stored on the invite and used when the invite is accepted
- The sent invites list shows the assigned role for each invite
- The invite notification shown to the recipient indicates when they are being invited as a leader
- Existing invites default to "member" role (backward compatible)

### 44. Stats-Based Bracket Generation (Non-MVP) ✅ — Epic: Auto-Fill Bracket

**As a** pool member, **I want to** generate bracket picks based on team stats with customizable category weights **so that** I can create data-driven brackets tailored to my strategy preferences.

**Acceptance Criteria:**

- **Entry point — Auto-fill "Custom" option:**
  - A 4th option, "Custom", is added to the existing auto-fill dropdown (alongside Chalk, Weighted Random, Random)
  - Selecting "Custom" opens a dedicated modal/dialog for configuring stats-based generation
- **Stat categories available for weighting:**
  - PPG, Opponent PPG, FG%, 3PT%, FT%, Rebounds per Game, Assists per Game, Steals per Game, Blocks per Game, Turnovers per Game
  - For Opponent PPG and Turnovers per Game, lower values are treated as better (inverted)
- **Presets:**
  - User can select from predefined presets that auto-populate weights:
    - **Offense-Heavy**: PPG, FG%, 3PT%, FT% weighted high
    - **Defense-Heavy**: Opponent PPG (inverted), Steals, Blocks, Turnovers (inverted) weighted high
    - **Balanced**: even weight across all stat categories
    - **Rebounding & Hustle**: Rebounds, Steals, Blocks weighted high
  - Selecting a preset populates the custom weight controls, which the user can further adjust
- **Custom weights:**
  - User can manually adjust the weight for each stat category
  - UI should make it intuitive to see which stats are emphasized (implementation detail left to developer discretion — e.g., sliders, numeric inputs, or tiered dropdowns)
- **Chaos level (upset probability):**
  - User selects a chaos level that controls how likely upsets are: **Low**, **Medium**, **High**
  - Low: stats-favored team wins almost always; High: significant randomness, more upsets
  - This replaces a simple deterministic/probabilistic toggle — all levels introduce some probability, but Low is near-deterministic
- **Generation behavior:**
  - Populates all remaining unpicked games in the bracket (same as existing auto-fill)
  - Games are resolved in round order so earlier-round picks feed into later rounds
  - User can modify any generated picks before submitting
  - Available during bracket creation and editing (before tournament lock)
- **Missing stats handling:**
  - If a stat category has no data for one or both teams in a matchup, that category is skipped and remaining categories determine the pick
  - If no stat data is available for either team, falls back to seed-based logic
- **Single-game pick from team comparison:**
  - When viewing the team comparison dialog for a specific matchup in the bracket builder, a "Pick by Stats" button is available
  - Clicking it uses the stats-based logic (with the user's last-used preset/custom config and chaos level) to auto-pick the winner for that single game
  - If no prior config has been set, defaults to Balanced preset with Low chaos

### 49. Splash Page Differentiation & Redesign (Non-MVP) ✅ — Epic: Branding

**As a** visitor, **I want** the splash page to clearly communicate what makes Bracketsball different from ESPN, Yahoo, and CBS bracket apps **so that** I understand why I should use it over the competition.

**Acceptance Criteria:**

- Hero section communicates indie/friend-group positioning (not generic "bracket app" messaging)
- Comparison section highlights key differentiators vs. big bracket apps (multiple brackets per pool, custom scoring, stats-based generation, no ads)
- Stats-based bracket generation feature is prominently showcased with a visual preview of the weight/chaos controls
- Feature cards highlight unique capabilities (multiple brackets, custom scoring, potential points tracking, built for groups)
- Trust/indie section communicates that Bracketsball is fan-built, free, ad-free, and open source
- How It Works section is retained and tightened
- Final CTA with urgency messaging is retained
- Accessibility: screen reader text on comparison icons, decorative SVG has aria-hidden
- Page builds and passes lint with zero errors

### 25. Auto-Fill Bracket Picks (Non-MVP) — Epic: Auto-Fill Bracket

**As a** pool member, **I want to** auto-fill my bracket with generated picks **so that** I can quickly create an entry without manually picking every game.

**Acceptance Criteria:**

- User can choose from two auto-fill strategies:
  - **Chalk (Higher Seed Always)**: the higher-seeded team always wins
  - **Weighted Random**: winners are randomly selected, weighted toward the higher seed based on the seed differential
- Auto-fill populates all remaining unpicked games in the bracket
- User can modify any auto-filled picks before submitting
- Auto-fill is available during bracket creation and editing (before tournament lock)

### 41. Unused Code Enforcement & Cleanup (Non-MVP) ✅ — Epic: Tech Debt

**As a** developer, **I want** a lint rule that catches unused exports and dead code, plus a one-time audit to remove existing unused code, **so that** the codebase stays lean and maintainable.

**Acceptance Criteria:**

- **Lint enforcement:**
  - Add a tool (e.g., `knip` or `ts-prune`) to detect unused exports, unused files, and dead code
  - Integrate into the CI/lint pipeline so unused code is caught before merge
  - Document the chosen tool and configuration in `docs/technical/standards.md`
- **One-time audit:**
  - Run the tool across the entire codebase and remove all confirmed unused exports and dead code (e.g., `getPublicPoolById` and similar)
  - Verify removal doesn't break builds or tests
- **Ongoing standard:**
  - Add a standard to `docs/technical/standards.md` that exported functions/types must have at least one consumer — no speculative exports

### 42. Codebase Standards Audit (Non-MVP) ✅ — Epic: Tech Debt

**As a** developer, **I want** an audit of the codebase against `docs/technical/standards.md` **so that** existing code conforms to our documented conventions and any gaps are fixed.

**Acceptance Criteria:**

- Audit every standard in `docs/technical/standards.md` against the current codebase, including but not limited to:
  - **Project structure**: files colocated correctly, shared components in `components/`, one component per file
  - **Naming conventions**: files/folders kebab-case, components PascalCase, functions camelCase, constants UPPER_SNAKE_CASE, DB tables/columns snake_case
  - **TypeScript**: no unnecessary `any`, correct use of `interface` vs `type`, `@/*` path alias used consistently, `satisfies` where appropriate
  - **React & Next.js**: Server Components by default, no `useEffect` for data fetching, `next/image` and `next/link` used, Server Actions for mutations
  - **Forms**: React Hook Form + Zod, schemas in `lib/validators/`
  - **UI & Styling**: no raw color classes (only CSS variable-based), no arbitrary color values, mobile-first responsive design, no inline `style` props
  - **Database**: queries in `lib/db/queries/` (no inline SQL), transactions for multi-step writes, parameterized queries
  - **API Routes & Server Actions**: Zod validation at boundaries, thin actions calling shared query functions, cron auth via shared secret
  - **Error handling**: `error.tsx` boundaries, `notFound()` usage, no internal error details leaked to client
  - **Linting & formatting**: zero errors from `pnpm lint` and `pnpm build`
- Document all violations found
- Fix all violations
- Verify fixes pass `pnpm lint`, `pnpm build`, and don't break existing functionality

### 21. Transaction Audit (Non-MVP) ✅ — Epic: Tech Debt

**As a** developer, **I want to** audit all existing query functions and server actions for missing transactions **so that** data integrity is guaranteed across the app.

**Acceptance Criteria:**

- Audit all files in `lib/db/queries/` for functions that perform multiple DB writes without a transaction
- Audit all server actions for action functions that call multiple write query functions without wrapping in a transaction
- All query functions that perform multiple writes use `db.transaction()`
- All server actions that call multiple write functions accept/pass a `DbClient` parameter and wrap writes in a single transaction
- Add `DbClient` optional parameter to query functions that need to participate in action-level transactions
- Standardize the `client: DbClient = db` pattern across all query functions — establish a consistent convention for when and how query functions accept a transaction client, including handling the dual-use case (standalone with own transaction vs. participating in a caller's transaction) without ad-hoc `client === db` checks
- Document the chosen pattern in `docs/technical/standards.md` so future query functions follow the same approach
- Document any functions that were fixed

### 16. Manage Bracket Scoring Settings (Non-MVP) ✅ — Epic: Pool Settings

**As a** pool leader, **I want to** customize scoring per round **so that** I can tailor the pool's competitiveness.

**Acceptance Criteria:**

- Points per round can be customized individually
- Only pool leaders can edit scoring
- Changes are locked once tournament games begin

### 33. Team & Game Info in Bracket Builder (Non-MVP) — Epic: Bracket UX Enhancements

**As a** pool member filling out my bracket, **I want to** see supplemental information about each team and game **so that** I can make more informed picks — especially for teams I'm unfamiliar with.

**Acceptance Criteria:**

- **Investigation phase:** Research how to source supplemental team data (records, stats, strength ratings, short team descriptions). Evaluate options including:
  - ESPN API (existing integration) — check if team records (overall and conference), stats, rankings, or team descriptions are available
  - Other public/free sports data APIs (e.g., NCAA, kenpom-style ratings)
  - Static/manually curated data as a fallback
- Document findings and chosen approach before implementation begins
- **Implementation — Game Details Button (pending investigation):**
  - Each game matchup in the bracket builder has a small "details" button (e.g., info icon)
  - Clicking/tapping opens a popover or modal with:
    - Game venue/location
    - Team records: overall (W-L) and conference (W-L) for each team
    - Strengths, weaknesses, or other scouting-style notes per team (content depends on data source availability)
    - Any other useful context (e.g., conference name, national ranking)
  - Details button should be unobtrusive — doesn't clutter the pick UI
  - Works on both desktop and mobile
- **Implementation — Game Date/Time in Bracket View:**
  - Enrich the bracket view (read-only bracket detail, not just the builder) to display the scheduled date and time for each game
  - Date/time should be shown inline on each game card where space allows
  - Games that have already been played can show the date played
- **Data requirements:**
  - Data is sourced automatically where possible (synced or fetched), with admin override capability
  - New team fields (records, descriptions) stored in the DB and kept in sync

### 18. Bracket Pool Public/Private Toggle (Non-MVP) ✅ — Epic: Public Pools

**As a** pool leader, **I want to** make my pool public or private **so that** I can control who can discover and join it.

**Acceptance Criteria:**

- Pool can be toggled between public and private
- Private pools are invite-only
- Public pools appear in search results
- Toggle available at creation and in settings

### 20. Public Pool Search (Non-MVP) ✅ — Epic: Public Pools

**As a** user, **I want to** search for public pools **so that** I can find and join open competitions.

**Acceptance Criteria:**

- User can search public pools by name
- User can filter by brackets-per-entry range and pool size range
- Only pools with available capacity are shown
- User can join directly from search results

### 43. Improved Delete Confirmations (Non-MVP) ✅ — Epic: UX

**As a** user, **I want** delete confirmations to be appropriately protective **so that** I don't accidentally delete important data.

**Acceptance Criteria:**

- **Pool deletion:** Confirmation dialog requires the user to type the pool name before the delete button is enabled
- **Account deletion:** Confirmation uses a simple popup modal with a confirm/cancel button (no typing required)
- Both confirmations clearly warn the user about what will be permanently removed
- Delete button remains disabled until the confirmation condition is met (pool name typed for pools, button click for account)

### 17. In-App User Invites (Non-MVP) — Epic: Pool Members

**As a** pool member, **I want to** invite existing users by searching for them **so that** I don't need to share a link externally.

**Acceptance Criteria:**

- User can search for other users by username
- Selected users receive an in-app invite notification
- Invited users can accept or decline

### 45. Dark/Light Mode Team Icons (Non-MVP) ✅ — Epic: Bracket UX Enhancements

**As a** user, **I want** team logos to display appropriately for my current theme (light or dark mode) **so that** logos remain clear and visually correct regardless of my theme preference.

**Acceptance Criteria:**

- **Investigation phase:** Check ESPN API responses for dark-mode logo variants (ESPN typically provides both light and dark logo URLs per team) and document findings
- **Data model update:** If ESPN provides dark-mode logos, add a `darkLogoUrl` (or equivalent) field to the team table and sync it from ESPN
- **ESPN sync update:** Update the ESPN sync adapter to pull and store the dark-mode logo URL alongside the existing logo URL
- **Frontend display:** Update all team logo rendering across the app to use the appropriate logo based on the user's current theme (light/dark mode):
  - Bracket builder (matchup cards, team comparison dialog)
  - Bracket viewer (read-only bracket detail)
  - Pool standings (champion pick column)
  - Admin team management UI
- **Theme-aware logic:** Use `next-themes` (already integrated) to detect the current theme and select the correct logo URL
- **Fallback:** If a dark-mode logo is unavailable for a team, fall back to the standard logo URL

### 37. Team Mascot / Nickname Display (Non-MVP) ✅ — Epic: Bracket UX Enhancements

**As a** user, **I want to** see team mascots alongside school names **so that** teams feel more identifiable and the app feels more like a real sports experience.

**Acceptance Criteria:**

- Add a `mascot` (or `nickname`) field to the `team` table (e.g., "Boilermakers", "Jayhawks")
- ESPN provides this via the `name` field on team objects (separate from `location` which is the school name) — sync it automatically
- Display mascot alongside school name where space allows (bracket builder, team comparison dialog, standings)
- On compact views (matchup cards), continue showing short name only
- Admin can edit mascot via team management UI

### 38. Admin Manual Team & Game Data Entry (Non-MVP) ✅ — Epic: Bracket UX Enhancements

**As an** admin, **I want to** manually enter and edit team stats and game details **so that** I can fill in data ESPN doesn't provide (e.g., conference record, strength of schedule, NET ranking) and correct any inaccuracies.

**Acceptance Criteria:**

- Admin can edit all team stats fields on the tournament team admin page (overall record, conference record, conference name, PPG, opp PPG, FG%, 3PT%, FT%, RPG, APG, SPG, BPG, TOPG, AP ranking, SOS)
- Admin can edit game details: start time, venue name, venue city, venue state
- Manual edits are not overwritten by ESPN sync (sync only writes non-null fields from ESPN)
- Changes take effect immediately in the bracket builder comparison view

### 40. GitHub Repo Link in Footer (Non-MVP) ✅ — Epic: Branding

**As a** visitor or user, **I want to** see a link to the GitHub repository in the app footer **so that** I can view the source code and contribute.

**Acceptance Criteria:**

- Add a GitHub icon/link to the existing footer alongside privacy, terms, and contact links
- Link points to the Bracketsball GitHub repository
- Opens in a new tab

---

## Completed Non-MVP Stories

### 28. SEO Plan & Implementation (Non-MVP) ✅ — Epic: Branding

**As the** product owner, **I want** the app to be discoverable via search engines **so that** organic traffic can find Bracketsball.

**Acceptance Criteria:**

- Metadata: proper `<title>`, `<meta description>`, and Open Graph / Twitter Card tags on all public pages (splash page, login)
- `robots.txt` allows crawling of public pages, disallows authenticated app routes
- `sitemap.xml` generated for public pages
- Structured data (JSON-LD) for the splash page (WebApplication or SoftwareApplication schema)
- Canonical URLs set on all pages
- Lighthouse SEO score ≥ 90 on the splash page
- Document the SEO strategy and any ongoing tasks in `docs/technical/seo-plan.md`

### 26. Fix Bracket Submit Double-Click (Non-MVP) ✅ — Epic: Bug Fixes

**As a** pool member, **I want** bracket submission to show a success indicator on the first click **so that** I don't have to click submit twice.

**Acceptance Criteria:**

- Clicking submit once successfully submits the bracket and shows a success indicator
- Investigate and fix the root cause of requiring two clicks
- Submit button shows loading/disabled state while submission is in progress

### 19. Theme Toggle (Non-MVP) ✅ — Epic: UX

**As a** user, **I want to** switch between light, dark, and system theme modes **so that** I can use the app comfortably in any lighting condition.

**Acceptance Criteria:**

- User can toggle between light, dark, and system theme modes
- Theme preference persists across sessions (via next-themes)
- Toggle is accessible from the user dropdown menu (desktop) and mobile navigation menu
- System mode automatically follows the user's OS preference

### 22. Remove User Dashboard (Non-MVP) ✅ — Epic: UX Cleanup

**As a** user, **I want** the app to default to the Pools page **so that** I land on the most useful page without an unnecessary dashboard.

**Acceptance Criteria:**

- Remove the user dashboard page
- Default authenticated route (`/`) redirects to the Pools page
- Navigation no longer shows a "Dashboard" link

### 23. Remove Admin Dashboard (Non-MVP) ✅ — Epic: UX Cleanup

**As an** admin, **I want** the admin area to default to the Teams tab **so that** I skip the unnecessary dashboard and land on actionable content.

**Acceptance Criteria:**

- Remove the admin dashboard tab/page
- Admin area defaults to the Teams tab
- Admin navigation no longer shows a "Dashboard" link

### 24. Auto-Determine Game Winner from Scores (Non-MVP) ✅ — Epic: UX Cleanup

**As an** admin, **I want** the winning team to be automatically determined when I enter game scores **so that** I don't have to redundantly select the winner.

**Acceptance Criteria:**

- When both team scores are entered and the game is marked as final, the team with the higher score is automatically set as the winner
- Admin no longer needs to manually select the winning team
- Edge case: if scores are tied, no winner is auto-set (admin must resolve)

### 27. Splash / Marketing Page (Non-MVP) ✅ — Epic: Branding

**As a** visitor, **I want to** land on an engaging marketing page **so that** I understand what Bracketsball is and am motivated to sign up.

**Acceptance Criteria:**

- Public-facing splash page at `/` for unauthenticated users (authenticated users still redirect to Pools)
- Hero section with app name, tagline, and primary CTA to sign up / log in
- Feature highlights section summarizing the core value props (create pools, pick brackets, compete with friends, live scoring)
- Visual March Madness / basketball theming that conveys the app's purpose
- Responsive design — looks great on mobile, tablet, and desktop
- Fast load time — no heavy assets blocking initial render

### 29. App Theme & Design System (Non-MVP) ✅ — Epic: Branding

**As a** user, **I want** the app's visual design to feel like a March Madness bracket challenge **so that** the experience is fun and on-brand.

**Acceptance Criteria:**

- Define a cohesive color palette that evokes college basketball / March Madness energy (stored in CSS variables / Tailwind config)
- Update ShadCN theme tokens (primary, secondary, accent, destructive, etc.) to use the new palette
- Typography choices that feel sporty but remain readable
- Consistent application of the new theme across all existing pages (no page-by-page visual inconsistencies)
- Dark mode support with the new palette (can coordinate with Story 19 Theme Toggle)
- Document the design tokens and rationale in `docs/technical/design-system.md`

### 30. Icon Pack (Favicon, App Icons, OAuth) (Non-MVP) ✅ — Epic: Branding

**As a** user, **I want** the app to have a recognizable icon **so that** I can identify it in my browser tabs, home screen, and OAuth consent screens.

**Acceptance Criteria:**

- Custom app icon designed that represents Bracketsball (bracket + basketball motif)
- Favicon set: `favicon.ico` (16×16, 32×32), `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`
- PWA manifest (`site.webmanifest`) references the icon pack with correct sizes and MIME types
- Open Graph image (`og-image.png`) for social sharing — 1200×630
- OAuth provider icons: upload the app icon to Google Cloud Console and Discord Developer Portal for branded consent screens
- Icons render correctly across major browsers (Chrome, Safari, Firefox, Edge) and mobile home screen bookmarks

### 31. Legal & Contact Pages (Non-MVP) ✅ — Epic: Branding

**As a** visitor or user, **I want** access to a privacy policy, terms of service, and contact information **so that** I understand how my data is handled and how to reach the team.

**Acceptance Criteria:**

- Privacy Policy page at `/privacy` — covers data collection, OAuth data usage, cookies, data retention, and deletion rights
- Terms of Service page at `/terms` — covers acceptable use, account termination, liability limitations
- Contact information accessible from the footer (email or contact form)
- All three pages are publicly accessible (no auth required)
- Footer with links to privacy, terms, and contact is present on the splash page and within the authenticated app
- Pages are styled consistently with the app theme

### 35. Sticky Page Headers (Non-MVP) ✅ — Epic: Navigation UX

**As a** user, **I want** page headings and key controls to stay visible as I scroll **so that** I can always see context and access actions without scrolling back up.

**Acceptance Criteria:**

- Pool detail page: pool name, settings link, and section tabs stick to the top when scrolling
- Bracket editor: bracket name, status, stats, and action buttons (Auto-Fill, Clear, etc.) stick to the top when scrolling through the bracket
- Bracket viewer: bracket name and score summary stick to the top
- Admin pages: page header and tab navigation stick to the top
- Sticky headers have a subtle border or shadow to visually separate from scrolling content
- Works correctly on both desktop and mobile
- Does not obscure too much vertical space on small screens

### 36. Breadcrumb Navigation (Non-MVP) ✅ — Epic: Navigation UX

**As a** user, **I want to** see breadcrumb navigation on nested pages **so that** I can understand where I am and easily navigate back to parent pages.

**Acceptance Criteria:**

- Replace "Back to X" links with ShadCN Breadcrumb component on all nested pages
- Breadcrumb paths:
  - Pool detail: Pools > Pool Name
  - Bracket editor/viewer: Pools > Pool Name > Bracket Name
  - Pool settings: Pools > Pool Name > Settings
  - Admin pages: Admin > Section (Teams, Tournaments, etc.)
- Breadcrumbs are responsive — collapse or truncate gracefully on mobile
- Current page is shown as non-linked text; parent pages are clickable links
- Consistent placement across all pages

### 50. Seamless Invite Link Flow for Unauthed / New Users (Non-MVP) — Epic: Pool Members

**As a** user who received an invite link, **I want to** see the pool details before signing in, and be automatically joined to the pool after I sign in or sign up **so that** accepting an invite is frictionless even if I don't have an account yet.

**Acceptance Criteria:**

- Unauthed users visiting an invite link can see a public preview of the invite (pool name, inviter info, role they'll join as) without being redirected to login
- The preview page includes a CTA to sign in / sign up to accept the invite
- After the user authenticates (sign in or first-time sign up via OAuth), they are automatically joined to the pool — no additional "Join Pool" button click required
- After auto-join, the user is redirected to the pool detail page
- Standard invite validations still apply (expired, max uses reached, pool full, tournament started, already a member) and are shown on the public preview when applicable
- If the invite is invalid or expired, the unauthed user sees a clear error message without needing to sign in first

---

### 51. ESPN Sync & Dark Mode Bug Fixes (Non-MVP) ✅ — Epic: Bug Fixes

**As a** admin/user, **I want** ESPN team stats sync to correctly populate opponent PPG, dark mode team logos to render without hydration errors, and syncs to run faster **so that** the app data is complete and the UI is consistent.

**Acceptance Criteria:**

- Opponent PPG (oppPpg) is populated when syncing team stats for the current season
- The `fetchTeamInfo` endpoint is called when the requested season matches the current NCAA season, even when a season parameter is provided
- The `oppPpg` field is also extracted from the statistics endpoint's defensive category as a fallback
- Dark mode team logos render correctly without React hydration mismatch errors
- The TeamLogo component defers theme-dependent src selection until after client hydration
- The "Sync Team Stats" button and action are located in the tournament teams admin section (not games)
- ESPN sync delays are reduced from 300-500ms to 50ms per request

---

### 52. Unit Test Standings Sorting & Ranking Logic (Non-MVP) ✅ — Epic: Testing

**As a** developer, **I want** the standings sort, rank assignment, and tiebreaker logic to be extracted into pure functions with comprehensive unit tests **so that** I have confidence the standings are correct before the tournament starts.

**Acceptance Criteria:**

- The sort + rank logic from `getPoolStandings()` is extracted into a standalone, testable pure function
- Unit tests cover: ordering by points desc, potential desc, tiebreaker diff asc, name alphabetical
- Unit tests cover tie handling: same rank for tied entries, correct rank skip after ties (1, 1, 3)
- Unit tests cover tiebreaker edge cases: null tiebreaker, null championship total, exact prediction
- Unit tests cover empty and single-entry standings

---

### 53. Full Tournament Scenario Scoring Tests (Non-MVP) ✅ — Epic: Testing

**As a** developer, **I want** realistic multi-entry tournament scenario tests that exercise scoring across multiple rounds and bracket states **so that** I can verify scoring works correctly in production-like conditions.

**Acceptance Criteria:**

- Tests simulate realistic tournament states with 4-8 bracket entries and 20+ games
- Scenarios cover: early tournament (R64 partial), mid tournament (S16 done), late tournament (F4), complete tournament
- Scenarios cover upset-heavy brackets where most entries are busted
- Tests verify both individual entry scores and relative standings ordering across entries

---

### 56. "What I Need" Rooting Guide (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member watching the tournament, **I want to** see a personalized summary of which teams I need to win or lose **so that** I can quickly understand who to root for without mentally tracing through my bracket.

**Acceptance Criteria:**

- A "What I Need" tab or section is accessible from the pool detail page or individual bracket view
- For each upcoming/in-progress game, the view shows whether the user's bracket needs Team A or Team B to win, and why (e.g., "You picked Duke to the Elite 8 — they must win this game for you to earn 4 pts")
- Games are grouped by round and sorted by impact (highest potential points at stake first)
- Games where the user's picked team is already eliminated are shown as "lost" / no longer relevant
- If the user has multiple brackets in the pool, they can toggle between them
- Works on both desktop and mobile
- Only visible once the tournament has started (no value pre-tournament)

---

### 57. Bracket Copy / Duplicate (Non-MVP) ✅ — Epic: Bracket Creation

**As a** pool member, **I want to** duplicate one of my existing bracket entries **so that** I can create a variation without re-picking every game from scratch.

**Acceptance Criteria:**

- A "Duplicate" action is available on the user's bracket list (pool detail page) for each of their bracket entries
- Duplicating creates a new bracket entry pre-filled with all picks and tiebreaker from the source bracket
- The new bracket is named "{Original Name} (Copy)" by default, and the user can rename it
- The duplicate is created in draft/unsaved state — the user must review and submit it
- Duplication is only available before tournament lock (same as bracket creation)
- Duplication respects the pool's max brackets per user limit — if the user is already at the max, the action is disabled with an explanation
- The duplicated bracket is independent — editing it does not affect the original

---

### 58. Elimination Tracker (Non-MVP) — ✅ Epic: Tournament Experience

**As a** pool member, **I want to** see which brackets are mathematically eliminated from winning the pool **so that** I can focus my attention on brackets that are still in contention.

**Acceptance Criteria:**

- A bracket entry is "mathematically eliminated" when its current points + remaining potential points is less than the current leader's points
- Eliminated brackets are visually marked on the standings page (e.g., a subtle "Eliminated" badge, greyed-out styling, or strikethrough)
- Eliminated brackets are also marked on the user's own bracket list on the pool detail page
- The bracket detail view shows an elimination banner when applicable (e.g., "Mathematically eliminated — leader has X pts, your max possible is Y pts")
- Brackets that are still alive show a "Still alive" or "In contention" indicator
- Elimination status updates automatically as games are completed and standings sync
- Pre-tournament: no elimination indicators are shown
- Edge case: if all brackets are tied, none are eliminated

---

### 59. Pool Activity Feed (Non-MVP) — Epic: Pool Social

**As a** pool member, **I want to** see an activity feed and post comments within my pool **so that** I can trash talk, react to upsets, and stay engaged with my friends during the tournament.

**Acceptance Criteria:**

- A "Feed" or "Chat" tab is available on the pool detail page
- Pool members can post text messages (max ~500 characters)
- Messages display the author's profile picture, username, and timestamp
- Feed loads most recent messages first with pagination or infinite scroll
- Members can delete their own messages
- Pool leaders can delete any message (moderation)
- Feed is available before, during, and after the tournament
- No real-time requirement — messages appear on page load/refresh
- Works on both desktop and mobile

---

### 60. Pool Notifications (Non-MVP) — Epic: Pool Social

**As a** pool member, **I want to** receive notifications for key pool events **so that** I stay engaged without having to constantly check the app.

**Acceptance Criteria:**

- Users can opt in/out of notifications from their profile settings
- Notification triggers include:
  - A new member joined the pool
  - Tournament is about to lock (24 hours before R64 start)
  - A new round has started
  - User's standings position changed significantly (moved up or down 3+ spots)
  - A bracket entry was eliminated (if elimination tracker is implemented)
- Notifications are delivered via email (v1 — push notifications can come later)
- Each notification type can be individually toggled on/off
- Notifications include a direct link to the relevant pool/bracket page

---

### 61. Pool History / Past Seasons (Non-MVP) — Epic: Multi-Season Support

**As a** pool member, **I want to** view past tournament results within my pool **so that** I can see historical winners and relive previous seasons.

**Acceptance Criteria:**

- A "Past Seasons" tab or section is available on the pool detail page when the pool has bracket entries from previous tournaments
- Past seasons show the final standings for each completed tournament
- Users can click into past bracket entries to view picks and results (read-only)
- Past season winners are highlighted
- Current season remains the default view
- If no past seasons exist, the tab/section is hidden

---

### 62. Pool Awards / Badges (Non-MVP) — Epic: Pool Social

**As a** pool member, **I want to** see fun awards and badges after the tournament ends **so that** our pool has memorable highlights beyond just the final standings.

**Acceptance Criteria:**

- After the tournament is complete, an "Awards" section appears on the pool detail page
- Awards are automatically calculated based on bracket data. Examples:
  - **Champion**: highest-scoring bracket
  - **Cinderella Believer**: picked the most upsets (lower seed over higher seed)
  - **Chalk King**: picked the most favorites (higher seed)
  - **Best Upset Pick**: correctly predicted the biggest upset (largest seed differential)
  - **Crystal Ball**: closest tiebreaker prediction
  - **Last Place**: lowest-scoring bracket (good-natured)
- Each award shows the bracket name, owner, and relevant stat
- Awards are only shown after the championship game is final
- Works with any number of brackets (minimum thresholds for awards to make sense, e.g., at least 3 brackets in the pool)

---

### 63. Standings Movement Tracker (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want to** see how standings positions have changed over time **so that** I can track momentum and see who is surging or falling.

**Acceptance Criteria:**

- The standings page shows a position change indicator next to each bracket entry (e.g., green up arrow with "+3", red down arrow with "-2", or dash for no change)
- Position changes are calculated relative to the standings at the end of the previous round
- A "Movement" column or inline indicator is added to the standings table
- Newly submitted brackets (first appearance) show "NEW" instead of a movement indicator
- Pre-tournament: no movement indicators are shown (no previous round to compare to)

---

### 64. Side-by-Side Bracket Comparison (Non-MVP) — Epic: Bracket UX Enhancements

**As a** pool member, **I want to** compare two brackets side by side **so that** I can see where my picks diverge from a rival's and who is winning the head-to-head.

**Acceptance Criteria:**

- A "Compare" action is available from the standings page — user selects two brackets to compare
- The comparison view shows both brackets' picks for each game, highlighting where they differ
- Games where one bracket was correct and the other was wrong are visually distinguished
- A summary header shows each bracket's total points, potential points, and head-to-head record (games where they differ and one was correct)
- Users can compare any two brackets in the pool (their own or others')
- Works on desktop; mobile can use a stacked or swipeable layout
- Accessible from individual bracket view as well ("Compare with...")

---

### 65. Round Recap Digest (Non-MVP) — Epic: Tournament Experience

**As a** pool member, **I want to** see a recap summary after each round completes **so that** I can quickly understand how the round affected the pool standings.

**Acceptance Criteria:**

- After all games in a round are marked final, a round recap is generated for the pool
- Recap includes:
  - Number of upsets in the round
  - Which brackets gained the most points in the round
  - Standings changes (who moved up/down the most)
  - Number of brackets eliminated (if elimination tracker is implemented)
  - Notable picks: correct upset picks that few brackets had
- Recaps are accessible from the pool detail page (e.g., a "Recaps" section or inline on the feed)
- Recaps are generated automatically — no admin action required
- Each round's recap persists and can be viewed later

---

### 66. Pick Confidence Indicator (Non-MVP) — Epic: Bracket Creation

**As a** pool member filling out my bracket, **I want to** see how "chalky" or "chaotic" my overall bracket is **so that** I can calibrate whether I'm being bold enough or playing it too safe.

**Acceptance Criteria:**

- While creating or editing a bracket, a summary indicator shows the percentage of picks that match the higher seed (chalk percentage)
- The indicator updates in real-time as picks are made
- A descriptive label accompanies the percentage (e.g., "Very Chalky", "Balanced", "Upset Heavy", "Pure Chaos")
- Displayed in the bracket editor sticky header area alongside existing stats
- Does not block or influence picks — purely informational
- Only considers games that have been picked (not empty slots)

---

### 67. Aggregate Pick Percentages (Non-MVP) — Epic: Pool Social

**As a** pool member, **I want to** see what percentage of brackets in my pool picked each team **so that** I can see how my picks compare to the group consensus.

**Acceptance Criteria:**

- After tournament lock, each game on the bracket view shows the percentage of pool brackets that picked each team (e.g., "Duke 73% / UNC 27%")
- Percentages are calculated from all submitted brackets in the pool
- Before tournament lock, pick percentages are hidden to prevent influencing picks
- Percentages are shown as a subtle overlay or tooltip — not cluttering the main bracket view
- Available on both the bracket viewer and the bracket editor (read-only post-lock)

---

### 68. Upset Notifications (Non-MVP) — Epic: Tournament Experience

**As a** pool member, **I want to** be notified when a major upset happens that impacts my pool **so that** I stay engaged and can react in real time.

**Acceptance Criteria:**

- When a game marked as final is an upset (lower seed beats higher seed by 4+ seed lines), a notification is generated for the pool
- Notification includes: the upset result, how many brackets in the pool had the losing team advancing, and which brackets (if any) correctly predicted the upset
- Delivered via the same notification channel as pool notifications (#60) — email v1
- Users who have pool notifications enabled receive upset notifications by default (can be toggled separately)
- Only significant upsets trigger notifications (configurable threshold, default: 4+ seed differential)

---

### 54. Tiebreaker Edge Cases & Integration Tests (Non-MVP) — Epic: Testing

**As a** developer, **I want** dedicated tiebreaker edge case tests and optional integration tests for `syncStandingsForTournament` **so that** I have full confidence in the scoring pipeline end-to-end.

**Acceptance Criteria:**

- Tiebreaker tests cover: exact prediction (diff=0), symmetric over/under, null tiebreaker score, null championship total, tiebreaker only breaking ties when points and potential are equal
- Integration test seeds a test DB with pool, entries, picks, and games, calls `syncStandingsForTournament()`, and asserts persisted scores are correct
- Integration test mutates a game to "final", re-syncs, and verifies scores update

### 55. Per-Game & Round-Level Potential Points on Bracket (Non-MVP) ✅ — Epic: Bracket UX Enhancements

**As a** pool member viewing my bracket during a tournament, **I want to** see the potential points at stake on each game and a summary of earned/remaining/lost points per round **so that** I can quickly understand where my upside lies and how my bracket is performing at a glance.

**Acceptance Criteria:**

- Each matchup card footer shows potential points for non-final games: muted `+X pts` when picked team is still alive, red strikethrough `+X pts` when picked team is eliminated or pick was incorrect
- Correct picks continue to show green `+X pts` (unchanged)
- Each round column header shows a compact summary: earned points (green), remaining potential (muted), and lost points (red strikethrough)
- Round summaries only appear when there is tournament activity in that round
- Pre-tournament bracket editing is unaffected
- No changes to scoring calculation logic

---

### 70. Allow Picking Known R64 Team During First Four (Non-MVP) ✅ — Epic: Bug Fixes

**As a** pool member, **I want to** be able to pick the known team in a Round of 64 matchup even when the opposing First Four game is still in progress **so that** I'm not locked out of making picks just because I missed the First Four window.

**Acceptance Criteria:**

- When a First Four game is in progress and the user didn't pick it, the corresponding R64 game still allows picking the known (non-First Four) team
- Each team slot in a matchup card is independently clickable — a TBD slot doesn't block picking the known team
- Server-side validation continues to correctly accept picks for scheduled R64 games
- Once the First Four game completes, the previously-TBD slot becomes pickable

---

### 71. Additional Auto-Fill Presets (BPI, SOS/SOR) (Non-MVP) ✅ — Epic: Auto-Fill Bracket

**As a** pool member, **I want** additional auto-fill presets that emphasize BPI and strength of schedule/record metrics **so that** I can generate analytics-driven brackets without manually configuring stat weights.

**Acceptance Criteria:**

- New "BPI-Focused" preset heavily weights BPI Offense and BPI Defense, with minimal weight on box score stats
- New "Strength of Schedule & Record" preset heavily weights SOS and SOR
- New "Analytics (BPI + SOS/SOR)" preset combines BPI, SOS, and SOR at high weights for a holistic advanced metrics approach
- All new presets appear in the Custom Stats auto-fill dialog preset dropdown
- Remove "inverted hint" labels (e.g., "lower = better") from stat categories in the dialog — they are more confusing than helpful

---

### 72. Tiebreaker Uses Championship Finalists' PPG (Non-MVP) ✅ — Epic: Auto-Fill Bracket

**As a** pool member, **I want** the auto-fill tiebreaker score to be based on the championship finalists' PPG regardless of which auto-fill strategy I use **so that** the tiebreaker prediction is realistic and tailored to my bracket picks.

**Acceptance Criteria:**

- Auto-fill tiebreaker uses the sum of championship finalists' PPG when stats are available, for all strategies (chalk, random, weighted random, stats custom)
- Falls back to a random value in the 100-180 range only when finalist PPG stats are unavailable
- No change to manual tiebreaker entry behavior

---

### 74. Fix ESPN Sync Game Matching & Venue Display (Non-MVP) ✅ — Epic: Bug Fixes

**As a** user, **I want** game venues and start times to be correctly assigned to the right bracket slots **so that** the schedule and location info I see is accurate.

**Acceptance Criteria:**

- ESPN sync no longer falls back to arbitrary `candidates[0]` matching when multiple candidate games exist and no team data is available to disambiguate — skips the match instead, letting a future sync with teams match correctly
- Venue/city/state is displayed on matchup cards for all games (not just games with both teams assigned)
- BPI Defense stat direction is corrected: higher is better (was incorrectly inverted)
- BPI Defense auto-fill weight is corrected: not inverted (was incorrectly set)
- One-off cleanup script (`scripts/cleanup-espn-matches.ts`) clears incorrectly matched espnEventId/venue/startTime on R32+ games so re-sync can fix them

### 75. Eliminated Champion Red X Indicator (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want to** see a red "X" drawn through the champion pick icon when that team has been eliminated **so that** I can quickly see which brackets have a busted champion without opening each one.

**Acceptance Criteria:**

- On the pool standings table, if a bracket's champion pick has been eliminated, the team logo shows a red X overlay using the `destructive` CSS variable
- On the "My Brackets" section, the same red X overlay appears on eliminated champion picks
- The team logo is dimmed (reduced opacity + grayscale) to make the X more visually distinct
- The X is slightly larger than the logo for clear visibility
- No indicator is shown when the champion is still alive or pre-tournament

---

### 78. Show TBD for Unknown Game Times (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want** games with undetermined start times to show "TBD" instead of "12:00 AM" **so that** I'm not confused by a misleading midnight time that ESPN uses as a placeholder.

**Acceptance Criteria:**

- Games where ESPN has set the start time to midnight ET (their placeholder for "time not yet determined") display the date with "TBD" instead of the formatted time (e.g., "Mar 19 · TBD")
- This applies consistently across all game time displays: bracket matchup cards, team comparison dialog, and "What I Need" section
- A shared `formatGameDateTime` utility centralizes all game time formatting to enforce consistency
- Once ESPN updates the game with a real start time, it displays normally on the next sync
- No database schema changes required — detection happens at display time

---

### 80. Bracket Connector Lines (Non-MVP) ✅ — Epic: Bracket UX Enhancements

**As a** pool member, **I want to** see classic bracket connector lines between games across rounds **so that** the tournament path is visually clear and I can trace how teams advance through the bracket.

**Acceptance Criteria:**

- **Classic "L" connector lines** are drawn between each pair of feeder games and the game they feed into (e.g., two R64 games connect to their R32 game)
- Lines use the classic bracket style: horizontal line from the source game → vertical line joining the pair → horizontal line into the destination game
- **Color coding based on prediction correctness** (post-tournament start, viewer and editor):
  - **Green** (`success` CSS variable): the user's picked team won and advanced along this path (correct prediction)
  - **Red** (`failure` CSS variable): the user's picked team lost — the path is broken (incorrect prediction)
  - **Neutral/gray** (`muted-foreground` CSS variable): the game hasn't been played yet (pending)
- **Pre-tournament (editor picking mode):** all connector lines are neutral/gray since there are no results yet
- **Both bracket editor and bracket viewer** render connector lines
- **First Four → R64 connections** are included — First Four games connect into their corresponding R64 slots
- **Right-side regions** mirror the line direction (lines flow right-to-left toward the center, matching the existing RTL region layout)
- **All four regions** converge with lines through Final Four to the Championship game
- Lines are implemented via CSS (pseudo-elements or borders) rather than SVG/Canvas to stay consistent with the existing Tailwind/flexbox approach
- Lines do not interfere with existing matchup card click targets or hover states
- Lines render correctly at the existing `min-w-[1400px]` bracket width and with horizontal scroll on mobile
- Line thickness and color contrast meet accessibility standards (sufficient contrast against both light and dark theme backgrounds)

---

### 81. Fix "Picked to" Off-by-One in What I Need (Non-MVP) ✅ — Epic: Bug Fixes

**As a** pool member, **I want** the "Picked to" label in the What I Need section to show the correct round a team is picked to reach **so that** I can accurately see how far I expect each team to go.

**Acceptance Criteria:**

- "Picked to" displays the round the team advances TO (e.g., "Final Four") rather than the round of the game they win (e.g., "Elite 8")
- If a team is picked to win the Championship game, the label reads "Picked to win Championship"
- Existing unit tests are updated to reflect the corrected behavior

---

### 85. Update Marketing Page, Privacy Policy & Terms of Service (Non-MVP) ✅ — Epic: Branding

**As a** visitor or user, **I want** the marketing page to showcase Bracketsball's latest differentiating features, and the privacy policy and terms of service to reflect any changes since they were last updated **so that** new visitors understand the full value of the app and legal pages stay accurate.

**Acceptance Criteria:**

- **Marketing page updates:**
  - Add a feature highlight for the **Final Four Scenario Simulator** — enumerate every possible outcome and see projected standings for each scenario
  - Add a feature highlight for **Scenario-Aware Elimination** — know exactly when a bracket is mathematically eliminated, accounting for correlated picks
  - Add a feature highlight for the **"What I Need" Rooting Guide** — personalized breakdown of which teams to root for in every game and why
  - Add a feature highlight for **Standings Movement Tracking** — see who is surging or falling round over round
  - Add a feature highlight for **Bracket Connector Lines** — classic bracket visualization with color-coded correct/incorrect paths
  - Add a feature highlight for **Per-Game & Round-Level Potential Points** — see exactly where your upside lies at a glance
  - Review existing feature copy for accuracy and update if needed (e.g., auto-fill now has multiple stat-based presets)
  - Maintain the existing comparison section vs. big apps (ESPN, Yahoo) — update differentiators if new features strengthen the case
  - Ensure new sections are responsive and consistent with the current marketing page design
- **Privacy policy review:**
  - Review `/privacy` for accuracy given current data practices — update if any new data collection, third-party integrations, or processing has been introduced since the last update (March 8, 2026)
  - Update the "last updated" date if changes are made
- **Terms of service review:**
  - Review `/terms` for accuracy — update if new features introduce terms that should be covered (e.g., scenario simulator, public pools)
  - Update the "last updated" date if changes are made
- No changes are required to privacy/terms if they are still accurate — the review itself satisfies the acceptance criteria

---

### 76. Fix My Brackets Mobile Responsive Layout (Non-MVP) — Epic: Bug Fixes

**As a** pool member on mobile, **I want** the "My Brackets" section to display without overlapping text when the tournament has started **so that** I can read my bracket placement, points, and status clearly on small screens.

**Acceptance Criteria:**

- The elimination badge ("Alive"/"Eliminated") does not overlap with the ranking text on mobile
- Standings info (rank, points, potential) is readable without being clipped or overlapping other elements
- On small screens, the layout stacks the standings info below the bracket name/champion row rather than cramming everything into a single line
- Desktop layout remains unchanged (single row with all info inline)

---

### 77. Show Game Time Info on "What I Need" Games (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member watching the tournament, **I want to** see the game clock and period for live games and the scheduled date/time for upcoming games in the "What I Need" section **so that** I can quickly gauge game status without switching to another app.

**Acceptance Criteria:**

- For in-progress games in the "What I Need" section, the `statusDetail` (e.g., "1st Half 12:34", "Halftime", "2nd Half 5:00") is displayed alongside the score and "Live" badge
- The `statusDetail` field is already synced from ESPN and stored on the `tournamentGame` table — no new data sync work is needed
- The game data passed from the pool detail server component to the `WhatINeedCard` client component includes `statusDetail`
- Both desktop (`DesktopGameRow`) and mobile (`MobileGameCard`) layouts show the status detail
- When `statusDetail` is null but the game is in progress, fall back to showing just "Live" (current behavior)
- For scheduled games with a `startTime`, display the formatted date and time (e.g., "Mar 20, 7:00 PM")
- Both desktop and mobile layouts show the scheduled time for upcoming games
- Final games are unaffected

---

### 73. Auto-Fill Algorithm Audit & Fixes (Non-MVP) ✅ — Epic: Auto-Fill Bracket

**As a** pool member, **I want** the stats-based auto-fill algorithm to produce accurate, well-differentiated brackets **so that** my stat weight configuration meaningfully influences the generated picks.

**Acceptance Criteria:**

- All-zero stat weights are prevented in the UI — the Generate button is disabled with a validation message when every weight slider is set to 0
- Equal-seed fallback in the stats path uses a coin flip (consistent with the chalk strategy) instead of always favoring team1
- Stat normalization uses global ranges across all tournament teams instead of per-matchup min-max, so that actual magnitude differences between teams are preserved in the composite score and the chaos closeness metric is reliable

---

### 69. Enrich My Brackets Section Post-Tournament Start (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want to** see my placement, points, and potential points in the "My Brackets" section once the tournament starts **so that** I can quickly check how my brackets are performing without scanning the full standings table.

**Acceptance Criteria:**

- Once the tournament has started, each bracket row in "My Brackets" shows:
  - Placement in the pool standings (e.g., "3rd of 12")
  - Points earned so far
  - Potential points remaining
- Brackets are sorted by placement (best first) once the tournament starts; pre-tournament order is unchanged
- The "Submitted" badge is hidden once the tournament starts (all visible brackets are submitted by then)
- Draft/unsubmitted brackets are hidden once the tournament starts (they were never locked in)
- Pre-tournament behavior is unchanged (draft management, duplicate/delete actions, submitted badge)

---

### 79. Hide No-Stake Games in "What I Need" (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want** the "What I Need" section to only show games where I have a stake **so that** the section is focused and every game listed is one I actually need a result from.

**Acceptance Criteria:**

- Games where `rootFor` is `"none"` (neither team was picked to advance) are excluded from the "What I Need" results entirely
- The filtering happens in `computeWhatINeed` so the data layer is clean — no UI-level filtering needed
- All "No stake" UI handling (opacity, labels) is removed from the component since those games will never appear
- Existing tests are updated to reflect the new filtering behavior
- If all games in a round are no-stake, that round group is omitted entirely

### 82. Scenario-Aware Elimination Detection (Non-MVP) ✅ — Epic: Tournament Experience

**As a** pool member, **I want** the elimination status to account for correlated picks (where competitors ahead of me also gain points from the same outcomes) **so that** the "Alive" / "Eliminated" indicator is accurate even when shared picks make it impossible to close the gap.

**Acceptance Criteria:**

- **Scenario-based elimination** replaces the simple ceiling-vs-floor check once the Final Four begins (i.e., when all Elite 8 games are final)
- For each bracket entry, all possible remaining tournament outcome combinations are enumerated (at most 8 scenarios with 3 games left), and the entry's score is computed in each scenario against all other entries
- An entry is marked "Eliminated" only if there is **no** scenario in which it finishes in the top N (where N corresponds to the Contention toggle: 1st, Top 2, Top 3)
- The Contention toggle (1st, Top 2, Top 3) continues to work with the new logic
- **Pre-Final Four**: the existing simple elimination check (`potentialPoints` vs `totalPoints`) remains in use
- Existing elimination UI (badge, banner, opacity) works unchanged — only the underlying determination changes
- Unit tests cover correlated-pick scenarios where the simple check would say "Alive" but the scenario check correctly says "Eliminated", and vice versa

---

### 83. Final Four Scenario Simulator (Non-MVP) — Epic: Tournament Experience

**As a** pool member, **I want** to see all possible tournament outcome scenarios and the resulting standings once the Final Four is set **so that** I can understand exactly what needs to happen for my bracket to win (or finish top N).

**Acceptance Criteria:**

- **Appears on the pool detail page** as a new section once all Elite 8 games are final and at least one Final Four / Championship game is still pending
- **Removed automatically** once the Championship game is final (tournament is over)
- **Visible to all pool members** (not user-specific)
- **Scenario enumeration**: all possible outcomes of remaining games are listed (8 scenarios with 3 games remaining, 4 with 2, 2 with 1)
- **Summary row per entry (Option C UI)**: each bracket entry shows a compact summary — best possible finish, worst possible finish, and number of scenarios in which it wins (or finishes top N)
- **Expandable detail**: users can expand to see the full standings for each individual scenario, including game outcomes (with team logos) and resulting rankings
- **Points ties**: when entries are tied on points in a scenario, display "Tied on points — tiebreaker TBD" rather than guessing tiebreaker outcome
- **Contention toggle integration**: the summary adapts to the selected contention level (1st, Top 2, Top 3) — e.g., "Finishes top 2 in 5/8 scenarios"
- **Responsive**: works on both desktop and mobile layouts
- **Scenario labels**: each scenario is labeled descriptively using the game outcomes (e.g., "Duke over Houston, UConn over Auburn, Duke over UConn")

---

### 84. Scenario Simulator UX Improvements (Non-MVP) — Epic: Tournament Experience

**As a** pool member, **I want** to open multiple scenario breakdowns at once and filter contention independently between standings and the scenario simulator **so that** I can compare scenarios side-by-side and view different contention levels in each section without them interfering with each other.

**Acceptance Criteria:**

- **Multi-open scenario accordions**: users can expand multiple scenario detail sections simultaneously in the scenario simulator (currently only one can be open at a time)
- **Independent contention filters**: the standings section and the scenario simulator section each have their own contention filter (1st, Top 2, Top 3) that operate independently — changing one does not affect the other
- **Default behavior**: both filters default to the same value they do today (1st place contention)
- **Responsive**: both changes work correctly on desktop and mobile layouts

---

## Summary

| #   | Story                                     | Epic                    | MVP | Status |
| --- | ----------------------------------------- | ----------------------- | --- | ------ |
| 0   | Tech Stack Setup                          | Tech Stack Setup        | Yes | Done   |
| 1   | Social Login                              | Auth                    | Yes | Done   |
| 2   | Profile Management                        | Profile                 | Yes | Done   |
| 3   | Account Deletion                          | Account                 | Yes | Done   |
| 4   | Create Bracket Pool                       | Pools Setup             | Yes | Done   |
| 5   | Manage Bracket Pool Settings              | Pool Settings           | Yes | Done   |
| 6a  | Admin Tournament Management               | Sports Data             | Yes | Done   |
| 6b  | ESPN Data Sync                            | Sports Data             | Yes | Done   |
| 7   | Bracket Pool Invite Links                 | Pool Members            | Yes | Done   |
| 8   | Manage Pool Members                       | Pool Members            | Yes | Done   |
| 9   | Create Bracket Entry                      | Bracket Creation        | Yes | Done   |
| 10  | Edit Bracket Entry                        | Bracket Creation        | Yes | Done   |
| 11  | View Own Brackets                         | Bracket Visibility      | Yes | Done   |
| 12  | View Other Members' Brackets              | Bracket Visibility      | Yes | Done   |
| 13  | View Pool Standings                       | Bracket Visibility      | Yes | Done   |
| 14  | View Individual Bracket Detail            | Bracket Visibility      | Yes | Done   |
| 15  | Live Bracket Scoring & Standings          | Scoring & Standings     | Yes | Done   |
| 46  | Bracket Lock at R64 Start                 | Tournament Lock         | Yes | Done   |
| 34  | Configure ESPN Sync Cron Jobs             | Pre-Tournament Setup    | Yes | Done   |
| 39  | Validate Cron Sync Performance            | Pre-Tournament Setup    | Yes | Done   |
| 32  | Update External Services Branding         | Branding                | Yes | Done   |
| 26  | Fix Bracket Submit Double-Click           | Bug Fixes               | No  | Done   |
| 25  | Auto-Fill Bracket Picks                   | Auto-Fill Bracket       | No  | Done   |
| 21  | Transaction Audit                         | Tech Debt               | No  | Done   |
| 16  | Manage Bracket Scoring Settings           | Pool Settings           | No  | Done   |
| 33  | Team & Game Info in Bracket Builder       | Bracket UX Enhancements | No  | Done   |
| 28  | SEO Plan & Implementation                 | Branding                | No  | Done   |
| 18  | Bracket Pool Public/Private Toggle        | Public Pools            | No  | Done   |
| 20  | Public Pool Search                        | Public Pools            | No  | Done   |
| 35  | Sticky Page Headers                       | Navigation UX           | No  | Done   |
| 36  | Breadcrumb Navigation                     | Navigation UX           | No  | Done   |
| 37  | Team Mascot / Nickname Display            | Bracket UX Enhancements | No  | Done   |
| 38  | Admin Manual Team & Game Data Entry       | Bracket UX Enhancements | No  | Done   |
| 40  | GitHub Repo Link in Footer                | Branding                | No  | Done   |
| 41  | Unused Code Enforcement & Cleanup         | Tech Debt               | No  | Done   |
| 42  | Codebase Standards Audit                  | Tech Debt               | No  | Done   |
| 43  | Improved Delete Confirmations             | UX                      | No  | Done   |
| 44  | Stats-Based Bracket Generation            | Auto-Fill Bracket       | No  | Done   |
| 45  | Dark/Light Mode Team Icons                | Bracket UX Enhancements | No  | Done   |
| 47  | Filter Pool Data by Active Tournament     | Multi-Season Support    | No  | Done   |
| 17  | In-App User Invites                       | Pool Members            | No  | Done   |
| 19  | Theme Toggle                              | UX                      | No  | Done   |
| 22  | Remove User Dashboard                     | UX Cleanup              | No  | Done   |
| 23  | Remove Admin Dashboard                    | UX Cleanup              | No  | Done   |
| 24  | Auto-Determine Game Winner                | UX Cleanup              | No  | Done   |
| 27  | Splash / Marketing Page                   | Branding                | No  | Done   |
| 29  | App Theme & Design System                 | Branding                | No  | Done   |
| 30  | Icon Pack (Favicon, App, OAuth)           | Branding                | No  | Done   |
| 31  | Legal & Contact Pages                     | Branding                | No  | Done   |
| 49  | Splash Page Differentiation               | Branding                | No  | Done   |
| 50  | Seamless Invite Flow for Unauthed         | Pool Members            | No  | Done   |
| 51  | ESPN Sync & Dark Mode Bug Fixes           | Bug Fixes               | No  | Done   |
| 52  | Unit Test Standings Sorting & Ranking     | Testing                 | No  | Done   |
| 53  | Full Tournament Scenario Tests            | Testing                 | No  | Done   |
| 54  | Tiebreaker Edge Cases & Integration       | Testing                 | No  |        |
| 55  | Per-Game & Round-Level Potential Pts      | Bracket UX Enhancements | No  | Done   |
| 56  | "What I Need" Rooting Guide               | Tournament Experience   | No  | Done   |
| 57  | Bracket Copy / Duplicate                  | Bracket Creation        | No  | Done   |
| 58  | Elimination Tracker                       | Tournament Experience   | No  | Done   |
| 59  | Pool Activity Feed                        | Pool Social             | No  |        |
| 60  | Pool Notifications                        | Pool Social             | No  |        |
| 61  | Pool History / Past Seasons               | Multi-Season Support    | No  |        |
| 62  | Pool Awards / Badges                      | Pool Social             | No  |        |
| 63  | Standings Movement Tracker                | Tournament Experience   | No  | Done   |
| 64  | Side-by-Side Bracket Comparison           | Bracket UX Enhancements | No  |        |
| 65  | Round Recap Digest                        | Tournament Experience   | No  |        |
| 66  | Pick Confidence Indicator                 | Bracket Creation        | No  |        |
| 67  | Aggregate Pick Percentages                | Pool Social             | No  |        |
| 68  | Upset Notifications                       | Tournament Experience   | No  |        |
| 70  | Allow Picking Known R64 Team During FF    | Bug Fixes               | No  | Done   |
| 71  | Additional Auto-Fill Presets (BPI/SOS)    | Auto-Fill Bracket       | No  | Done   |
| 72  | Tiebreaker Uses Finalist PPG              | Auto-Fill Bracket       | No  | Done   |
| 73  | Auto-Fill Algorithm Audit & Fixes         | Auto-Fill Bracket       | No  | Done   |
| 74  | Fix ESPN Sync Matching & Venue Display    | Bug Fixes               | No  | Done   |
| 75  | Eliminated Champion Red X Indicator       | Tournament Experience   | No  | Done   |
| 76  | Fix My Brackets Mobile Responsive         | Bug Fixes               | No  | Done   |
| 77  | Show Game Time Info on "What I Need"      | Tournament Experience   | No  | Done   |
| 78  | Show TBD for Unknown Game Times           | Tournament Experience   | No  | Done   |
| 79  | Hide No-Stake Games in What I Need        | Tournament Experience   | No  | Done   |
| 80  | Bracket Connector Lines                   | Bracket UX Enhancements | No  | Done   |
| 81  | Fix "Picked to" Off-by-One in What I Need | Bug Fixes               | No  | Done   |
| 82  | Scenario-Aware Elimination Detection      | Tournament Experience   | No  | Done   |
| 83  | Final Four Scenario Simulator             | Tournament Experience   | No  | Done   |
| 84  | Scenario Simulator UX Improvements        | Tournament Experience   | No  | Done   |
| 85  | Update Marketing, Privacy & Terms         | Branding                | No  | Done   |

**MVP Total: 21 stories (21 done, 0 remaining)** | **Post-MVP: 63 stories (47 done, 16 remaining)**
