import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import { getPoolInvitesByPoolId } from "@/lib/db/queries/pool-invites";
import { getPoolMembers } from "@/lib/db/queries/pool-members";
import { getSentInvitesForPool } from "@/lib/db/queries/pool-user-invites";
import {
  getBracketEntriesByPoolAndUser,
  getBracketEntryCountForUser,
  getChampionPicksForEntries,
  getPicksForEntry,
  getPoolStandings,
} from "@/lib/db/queries/bracket-entries";
import {
  getActiveTournament,
  getTournamentGames,
  getTournamentTeams,
  isTournamentComplete,
} from "@/lib/db/queries/tournaments";
import {
  hasTournamentStarted,
  getBracketLockTime,
} from "@/lib/db/queries/pools";
import { getStandingsMovement } from "@/lib/db/queries/standings";
import { CountdownTimer } from "@/components/countdown-timer";
import {
  canAccessPoolPage,
  canPerformPoolAction,
} from "@/lib/permissions/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteList } from "./invites/invite-list";
import { MemberList } from "./members/member-list";
import { SentInvitesList } from "./members/sent-invites-list";
import { CreateBracketDialog } from "./brackets/create-bracket-dialog";
import { BracketEntryRow } from "./brackets/bracket-entry-row";
import { PoolStandingsSection } from "@/components/pool/pool-standings-section";
import { WhatINeedCard } from "@/components/pool/what-i-need-card";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { StickySubHeader } from "@/components/sticky-sub-header";
import {
  getEliminationStatus,
  getScenarioEliminationStatus,
  type PoolScoring,
} from "@/lib/scoring";

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  const poolData = await getPoolById(id, session.user.id);

  if (!poolData) {
    notFound();
  }

  const isLeader = canPerformPoolAction(
    poolData.membership.role,
    "create-invite",
  );
  const invites = isLeader ? await getPoolInvitesByPoolId(id) : [];
  const members = await getPoolMembers(id);
  const sentUserInvites = isLeader ? await getSentInvitesForPool(id) : [];
  const remainingCapacity =
    poolData.pool.maxParticipants - poolData.memberCount;

  const [activeTournament, tournamentStarted, bracketLockTime] =
    await Promise.all([
      getActiveTournament(),
      hasTournamentStarted(),
      getBracketLockTime(),
    ]);
  const bracketEntries = activeTournament
    ? await getBracketEntriesByPoolAndUser(
        id,
        session.user.id,
        activeTournament.id,
      )
    : [];
  const bracketCount = activeTournament
    ? await getBracketEntryCountForUser(
        id,
        session.user.id,
        activeTournament.id,
      )
    : 0;
  const canCreateBracket =
    !!activeTournament &&
    !tournamentStarted &&
    bracketCount < poolData.pool.maxBracketsPerUser;

  const championPicks =
    bracketEntries.length > 0
      ? await getChampionPicksForEntries(bracketEntries.map((e) => e.id))
      : new Map();

  const poolScoring: PoolScoring = {
    scoringFirstFour: poolData.pool.scoringFirstFour,
    scoringRound64: poolData.pool.scoringRound64,
    scoringRound32: poolData.pool.scoringRound32,
    scoringSweet16: poolData.pool.scoringSweet16,
    scoringElite8: poolData.pool.scoringElite8,
    scoringFinalFour: poolData.pool.scoringFinalFour,
    scoringChampionship: poolData.pool.scoringChampionship,
  };

  const [standingsResult, tournamentComplete] = await Promise.all([
    activeTournament
      ? getPoolStandings(id, activeTournament.id, poolScoring)
      : null,
    activeTournament ? isTournamentComplete(activeTournament.id) : false,
  ]);
  const standings = standingsResult?.standings ?? [];
  const scenarioData = standingsResult?.scenarioData ?? null;

  // Movement data for standings (only when tournament has started)
  const movementMap =
    activeTournament && tournamentStarted
      ? await getStandingsMovement(id, activeTournament.id)
      : null;
  const movementData = movementMap?.size
    ? Object.fromEntries(movementMap)
    : undefined;

  // What I Need data: games, teams, and picks for submitted brackets
  const submittedEntries = bracketEntries.filter(
    (e) => e.status === "submitted",
  );
  const [tournamentGames, tournamentTeamsData, ...submittedPicks] =
    activeTournament && tournamentStarted && submittedEntries.length > 0
      ? await Promise.all([
          getTournamentGames(activeTournament.id),
          getTournamentTeams(activeTournament.id),
          ...submittedEntries.map((e) => getPicksForEntry(e.id)),
        ])
      : [[], [], ...submittedEntries.map(() => [])];

  // Build team map for client component (serializable as plain object)
  const teamMapForClient: Record<
    string,
    {
      name: string;
      shortName: string;
      abbreviation: string;
      logoUrl: string | null;
      darkLogoUrl: string | null;
      seed: number;
    }
  > = {};
  for (const t of tournamentTeamsData) {
    teamMapForClient[t.teamId] = {
      name: t.teamName,
      shortName: t.teamShortName,
      abbreviation: t.teamAbbreviation,
      logoUrl: t.teamLogoUrl,
      darkLogoUrl: t.teamDarkLogoUrl,
      seed: t.seed,
    };
  }

  // Build picks keyed by bracket entry ID
  const picksByBracket: Record<
    string,
    { tournamentGameId: string; pickedTeamId: string }[]
  > = {};
  submittedEntries.forEach((entry, i) => {
    picksByBracket[entry.id] = (submittedPicks[i] ?? []).map((p) => ({
      tournamentGameId: p.tournamentGameId,
      pickedTeamId: p.pickedTeamId,
    }));
  });

  // Serialize games for client (convert Date to string)
  const gamesForClient = tournamentGames.map((g) => ({
    id: g.id,
    round: g.round,
    status: g.status,
    statusDetail: g.statusDetail ?? null,
    startTime: g.startTime ? g.startTime.toISOString() : null,
    team1Id: g.team1Id,
    team2Id: g.team2Id,
    team1Score: g.team1Score,
    team2Score: g.team2Score,
    winnerTeamId: g.winnerTeamId,
  }));

  // Compute elimination status and standings info for user's brackets
  const myBracketElimination = new Map<string, boolean>();
  const myChampionElimination = new Map<string, boolean>();
  const myBracketStandings = new Map<
    string,
    { rank: number; totalPoints: number; potentialPoints: number }
  >();
  if (tournamentStarted && standings.length > 0) {
    const eliminationMap = scenarioData
      ? getScenarioEliminationStatus(standings, scenarioData, poolScoring, 1)
      : getEliminationStatus(standings, 1);
    standings.forEach((s, i) => {
      const isEliminated = eliminationMap.get(i) ?? false;
      // Only set for user's brackets
      if (bracketEntries.some((e) => e.id === s.id)) {
        myBracketElimination.set(s.id, isEliminated);
        myChampionElimination.set(s.id, s.isChampionEliminated);
        myBracketStandings.set(s.id, {
          rank: s.rank,
          totalPoints: s.totalPoints,
          potentialPoints: s.potentialPoints,
        });
      }
    });
  }

  // Post-tournament: filter to submitted only and sort by placement
  const displayedBracketEntries = tournamentStarted
    ? bracketEntries
        .filter((e) => e.status === "submitted")
        .sort((a, b) => {
          const aRank = myBracketStandings.get(a.id)?.rank ?? Infinity;
          const bRank = myBracketStandings.get(b.id)?.rank ?? Infinity;
          return aRank - bRank;
        })
    : bracketEntries;

  const bracketOptions = submittedEntries.map((e) => ({
    id: e.id,
    name: e.name,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <StickySubHeader>
        <PageBreadcrumbs
          crumbs={[
            { label: "Pools", href: "/pools" },
            { label: poolData.pool.name },
          ]}
          className="mb-2"
        />
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">{poolData.pool.name}</h1>
          <div className="flex gap-2">
            {canAccessPoolPage(poolData.membership.role, "settings") && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pools/${id}/settings`}>Settings</Link>
              </Button>
            )}
          </div>
        </div>
      </StickySubHeader>

      {bracketLockTime && !tournamentComplete && (
        <div className="mb-6">
          <CountdownTimer lockTime={bracketLockTime.toISOString()} />
        </div>
      )}

      {/* Standings + Scenario Simulator */}
      {activeTournament && (
        <PoolStandingsSection
          standings={standings}
          poolId={id}
          tournamentStarted={tournamentStarted}
          tournamentComplete={tournamentComplete}
          movement={movementData}
          currentUserId={session.user.id}
          scenarioData={scenarioData}
          poolScoring={poolScoring}
          teamMap={teamMapForClient}
        />
      )}

      {/* What I Need */}
      {activeTournament &&
        tournamentStarted &&
        !tournamentComplete &&
        submittedEntries.length > 0 && (
          <WhatINeedCard
            brackets={bracketOptions}
            picksByBracket={picksByBracket}
            games={gamesForClient}
            poolScoring={poolScoring}
            teamMap={teamMapForClient}
          />
        )}

      {/* My Brackets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Brackets</CardTitle>
            {activeTournament && !tournamentStarted && (
              <CreateBracketDialog
                poolId={id}
                canCreate={canCreateBracket}
                maxBrackets={poolData.pool.maxBracketsPerUser}
                currentCount={bracketCount}
              />
            )}
          </div>
          {!activeTournament && (
            <CardDescription>
              No active tournament. Brackets can be created once a tournament is
              active.
            </CardDescription>
          )}
        </CardHeader>
        {displayedBracketEntries.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {displayedBracketEntries.map((entry) => (
                <BracketEntryRow
                  key={entry.id}
                  entry={entry}
                  poolId={id}
                  tournamentStarted={tournamentStarted}
                  tournamentComplete={tournamentComplete}
                  canDuplicate={canCreateBracket}
                  championPick={championPicks.get(entry.id) ?? null}
                  isChampionEliminated={
                    myChampionElimination.get(entry.id) ?? false
                  }
                  isEliminated={myBracketElimination.get(entry.id) ?? null}
                  standingsInfo={myBracketStandings.get(entry.id) ?? null}
                  totalBrackets={standings.length}
                />
              ))}
            </div>
            {!tournamentStarted &&
              bracketEntries.some((e) => e.status !== "submitted") && (
                <p className="mt-3 text-sm text-warning-foreground">
                  You have unsubmitted brackets. Open each bracket and click
                  &quot;Submit Bracket&quot; to lock in your picks before the
                  tournament starts.
                </p>
              )}
          </CardContent>
        )}
      </Card>

      <div className="mt-6">
        <MemberList
          poolId={id}
          members={members}
          currentUserId={session.user.id}
          isLeader={isLeader}
          currentMembershipId={poolData.membership.id}
        />
      </div>
      {isLeader && (
        <div className="mt-6">
          <SentInvitesList
            poolId={id}
            invites={sentUserInvites}
            tournamentStarted={tournamentStarted}
          />
        </div>
      )}
      {isLeader && !tournamentStarted && (
        <div className="mt-6">
          <InviteList
            poolId={id}
            invites={invites}
            remainingCapacity={remainingCapacity}
          />
        </div>
      )}
    </div>
  );
}
