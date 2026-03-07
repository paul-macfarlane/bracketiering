# BRacketiering Backlog

Derived from [Original Vision](./originalVision.md). Items are organized by epic and priority. All MVP epics come first, followed by non-MVP epics at the end.

---

## Epic: Tech Stack Setup

### 0. Tech Stack Setup (MVP)

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

### 1. Social Login (MVP)

**As a** user, **I want to** sign up and log in with Google or Discord **so that** I can quickly access the app without creating a new password.

**Acceptance Criteria:**

- User can sign up / log in via Google OAuth
- User can sign up / log in via Discord OAuth
- On first login, a profile is auto-created with name, username, and profile picture pulled from the OAuth provider
- Sessions are managed securely via Better Auth
- Unauthenticated users are redirected to login

---

## Epic: Profile

### 2. Profile Management (MVP)

**As a** user, **I want to** edit my username, name, and profile picture URL **so that** I can personalize my identity in the app.

**Acceptance Criteria:**

- User can update their display name
- User can update their username (must be unique; show validation error if taken)
- User can update their profile picture URL
- Changes persist immediately

---

## Epic: Account

### 3. Account Deletion (MVP)

**As a** user, **I want to** delete my account **so that** my data is removed from the platform.

**Acceptance Criteria:**

- User can initiate account deletion from settings
- Deletion requires confirmation (e.g., type "DELETE" or confirm dialog)
- Once deleted, the account cannot be recovered
- All user activity (brackets, pool membership) is anonymized (not hard-deleted) so pool data integrity is maintained
- User is logged out and redirected after deletion

---

## Epic: Pools Setup

### 4. Create Bracket Pool (MVP)

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

### 5. Manage Bracket Pool Settings (MVP)

**As a** pool leader, **I want to** edit pool settings **so that** I can adjust the pool before games start.

**Acceptance Criteria:**

- All creation-time settings can be edited before the tournament starts
- Max brackets per user cannot be set below the current highest bracket count of any user in the pool
- Max participants cannot be set below the current member count
- Only pool leaders can edit settings
- Editing is locked once tournament games begin

---

## Epic: Sports Data

### 6. Sports Data Sync (MVP)

**As the** system, **I need to** sync live tournament data **so that** brackets can be scored accurately and users have game data to make their picks.

**Acceptance Criteria:**

- Sync bracket/game structure (regions, seeds, matchups)
- Sync team info (name, seed, logo/abbreviation)
- Sync game scoring (team scores, period, time remaining, game status)
- Sync game schedule (date, time, location)
- Data source: ESPN API via [this reference](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- Sync runs on a scheduled cron (via cron-job.org)
- Handles in-progress, completed, and upcoming game states

---

## Epic: Pool Members

### 7. Bracket Pool Invite Links (MVP)

**As a** pool member, **I want to** share an invite link **so that** others can join my pool.

**Acceptance Criteria:**

- Only pool leaders can generate and manage shareable invite links
- Invite link has a configurable expiration (default: 7 days)
- Invite link has configurable max uses (default: remaining pool capacity)
- Invite link can specify a role for joiners (member or leader)
- Expired or maxed-out links show an appropriate error
- Users who follow a valid link and are authenticated are added to the pool

---

## Epic: Bracket Creation

### 8. Create Bracket Entry (MVP)

**As a** pool member, **I want to** create a bracket entry with my tournament picks **so that** I can compete in the pool.

**Acceptance Criteria:**

- User can create a new bracket entry if they haven't hit the pool's max bracket limit
- Bracket entry has a user-defined name
- UI presents the full tournament bracket for picking game winners
- Each pick auto-saves so progress is not lost
- User must also enter a tiebreaker (predicted total score of the championship game)
- Only brackets with all games picked and a tiebreaker entered can be submitted
- Incomplete brackets are clearly indicated as drafts

### 9. Edit Bracket Entry (MVP)

**As a** pool member, **I want to** edit my bracket entry **so that** I can change my picks before the tournament starts.

**Acceptance Criteria:**

- All picks and tiebreaker can be modified before tournament games begin
- Same auto-save behavior as creation
- Editing is locked once the tournament starts

---

## Epic: Bracket Visibility

### 10. View Own Brackets (MVP)

**As a** user, **I want to** view a list of my brackets **so that** I can track my performance across pools.

**Acceptance Criteria:**

- User sees a list of all their bracket entries across pools
- Each entry shows: bracket name, pool name, current points, and potential remaining points
- User can click into an individual bracket for detail

### 11. View Other Members' Brackets (MVP)

**As a** pool member, **I want to** view other members' brackets **so that** I can see how my competition is doing.

**Acceptance Criteria:**

- User can view any other member's bracket list within a shared pool
- Same summary info shown: bracket name, current points, potential remaining points

### 12. View Pool Standings (MVP)

**As a** pool member, **I want to** see the pool standings **so that** I know where I rank.

**Acceptance Criteria:**

- Standings show all brackets in the pool ordered by: points (desc), then potential points (desc), then alphabetical (asc)
- Each row shows: bracket name, owner, current points, potential remaining points
- User can click into any bracket for detail

### 13. View Individual Bracket Detail (MVP)

**As a** user, **I want to** view an individual bracket in detail **so that** I can see every pick and its outcome.

**Acceptance Criteria:**

- Full bracket view showing all rounds and picks
- Each pick shows: teams, winner selected, actual result (if game is played)
- Visual indicators for correct picks, incorrect picks, and pending games
- Points earned per pick are visible

---

## Non-MVP Stories

### 14. Manage Bracket Scoring Settings (Non-MVP) — Epic: Pool Settings

**As a** pool leader, **I want to** customize scoring per round **so that** I can tailor the pool's competitiveness.

**Acceptance Criteria:**

- Points per round can be customized individually
- Only pool leaders can edit scoring
- Changes are locked once tournament games begin

### 15. In-App User Invites (Non-MVP) — Epic: Pool Members

**As a** pool member, **I want to** invite existing users by searching for them **so that** I don't need to share a link externally.

**Acceptance Criteria:**

- User can search for other users by username
- Selected users receive an in-app invite notification
- Invited users can accept or decline

### 16. Bracket Pool Public/Private Toggle (Non-MVP) — Epic: Public Pools

**As a** pool leader, **I want to** make my pool public or private **so that** I can control who can discover and join it.

**Acceptance Criteria:**

- Pool can be toggled between public and private
- Private pools are invite-only
- Public pools appear in search results
- Toggle available at creation and in settings

### 17. Theme Toggle (Non-MVP) — Epic: UX

**As a** user, **I want to** switch between light, dark, and system theme modes **so that** I can use the app comfortably in any lighting condition.

**Acceptance Criteria:**

- User can toggle between light, dark, and system theme modes
- Theme preference persists across sessions (via next-themes)
- Toggle is accessible from the user dropdown menu (desktop) and mobile navigation menu
- System mode automatically follows the user's OS preference

### 18. Public Pool Search (Non-MVP) — Epic: Public Pools

**As a** user, **I want to** search for public pools **so that** I can find and join open competitions.

**Acceptance Criteria:**

- User can search public pools by name
- User can filter by brackets-per-entry range and pool size range
- Only pools with available capacity are shown
- User can join directly from search results

---

## Summary

| #   | Story                              | Epic               | MVP |
| --- | ---------------------------------- | ------------------ | --- |
| 0   | Tech Stack Setup                   | Tech Stack Setup   | Yes |
| 1   | Social Login                       | Auth               | Yes |
| 2   | Profile Management                 | Profile            | Yes |
| 3   | Account Deletion                   | Account            | Yes |
| 4   | Create Bracket Pool                | Pools Setup        | Yes |
| 5   | Manage Bracket Pool Settings       | Pool Settings      | Yes |
| 6   | Sports Data Sync                   | Sports Data        | Yes |
| 7   | Bracket Pool Invite Links          | Pool Members       | Yes |
| 8   | Create Bracket Entry               | Bracket Creation   | Yes |
| 9   | Edit Bracket Entry                 | Bracket Creation   | Yes |
| 10  | View Own Brackets                  | Bracket Visibility | Yes |
| 11  | View Other Members' Brackets       | Bracket Visibility | Yes |
| 12  | View Pool Standings                | Bracket Visibility | Yes |
| 13  | View Individual Bracket Detail     | Bracket Visibility | Yes |
| 14  | Manage Bracket Scoring Settings    | Pool Settings      | No  |
| 15  | In-App User Invites                | Pool Members       | No  |
| 16  | Bracket Pool Public/Private Toggle | Public Pools       | No  |
| 17  | Theme Toggle                       | UX                 | No  |
| 18  | Public Pool Search                 | Public Pools       | No  |

**MVP Total: 14 stories** | **Post-MVP: 5 stories**
