import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import {
  getBracketEntryById,
  getBracketEntryCountForUser,
  getPicksForEntry,
  getPoolStandings,
} from "@/lib/db/queries/bracket-entries";
import {
  getTournamentById,
  getTournamentGames,
  getTournamentTeams,
} from "@/lib/db/queries/tournaments";
import {
  hasTournamentStarted,
  getBracketLockTime,
} from "@/lib/db/queries/pools";
import { BracketEditor } from "@/components/bracket/bracket-editor";
import { BracketViewer } from "@/components/bracket/bracket-viewer";
import type { BracketTeam } from "@/components/bracket/types";
import {
  getEliminationStatus,
  getScenarioEliminationStatus,
  type PoolScoring,
} from "@/lib/scoring";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string; bracketId: string }>;
}) {
  const { id: poolId, bracketId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  // Must be a pool member to view any bracket
  const poolData = await getPoolById(poolId, session.user.id);
  if (!poolData) {
    notFound();
  }

  const entry = await getBracketEntryById(bracketId);
  if (!entry || entry.poolId !== poolId) {
    notFound();
  }

  const isOwner = entry.userId === session.user.id;

  // Non-owners cannot view draft (unsubmitted) brackets
  if (!isOwner && entry.status !== "submitted") {
    notFound();
  }

  const [
    tournamentData,
    games,
    tournamentTeamsRaw,
    picks,
    tournamentStarted,
    bracketLockTime,
  ] = await Promise.all([
    getTournamentById(entry.tournamentId),
    getTournamentGames(entry.tournamentId),
    getTournamentTeams(entry.tournamentId),
    getPicksForEntry(bracketId),
    hasTournamentStarted(),
    getBracketLockTime(),
  ]);

  const tournamentTeams: BracketTeam[] = tournamentTeamsRaw.map((tt) => ({
    id: tt.teamId,
    name: tt.teamName,
    shortName: tt.teamShortName,
    abbreviation: tt.teamAbbreviation,
    mascot: tt.teamMascot,
    logoUrl: tt.teamLogoUrl,
    darkLogoUrl: tt.teamDarkLogoUrl,
    seed: tt.seed,
    region: tt.region,
    stats: {
      overallWins: tt.overallWins,
      overallLosses: tt.overallLosses,
      conferenceWins: tt.conferenceWins,
      conferenceLosses: tt.conferenceLosses,
      conferenceName: tt.conferenceName,
      ppg: tt.ppg,
      oppPpg: tt.oppPpg,
      fgPct: tt.fgPct,
      threePtPct: tt.threePtPct,
      ftPct: tt.ftPct,
      reboundsPerGame: tt.reboundsPerGame,
      assistsPerGame: tt.assistsPerGame,
      stealsPerGame: tt.stealsPerGame,
      blocksPerGame: tt.blocksPerGame,
      turnoversPerGame: tt.turnoversPerGame,
      apRanking: tt.apRanking,
      strengthOfSchedule: tt.strengthOfSchedule,
      strengthOfScheduleRank: tt.strengthOfScheduleRank,
      strengthOfRecord: tt.strengthOfRecord,
      strengthOfRecordRank: tt.strengthOfRecordRank,
      bpi: tt.bpi,
      bpiOffense: tt.bpiOffense,
      bpiDefense: tt.bpiDefense,
      bpiRank: tt.bpiRank,
      bpiOffenseRank: tt.bpiOffenseRank,
      bpiDefenseRank: tt.bpiDefenseRank,
    },
  }));

  const bracketPicks = picks.map((p) => ({
    tournamentGameId: p.tournamentGameId,
    pickedTeamId: p.pickedTeamId,
  }));

  const bracketPositions =
    tournamentData?.bracketTopLeftRegion &&
    tournamentData?.bracketBottomLeftRegion &&
    tournamentData?.bracketTopRightRegion &&
    tournamentData?.bracketBottomRightRegion
      ? {
          topLeft: tournamentData.bracketTopLeftRegion,
          bottomLeft: tournamentData.bracketBottomLeftRegion,
          topRight: tournamentData.bracketTopRightRegion,
          bottomRight: tournamentData.bracketBottomRightRegion,
        }
      : undefined;

  const poolScoring: PoolScoring = {
    scoringFirstFour: poolData.pool.scoringFirstFour,
    scoringRound64: poolData.pool.scoringRound64,
    scoringRound32: poolData.pool.scoringRound32,
    scoringSweet16: poolData.pool.scoringSweet16,
    scoringElite8: poolData.pool.scoringElite8,
    scoringFinalFour: poolData.pool.scoringFinalFour,
    scoringChampionship: poolData.pool.scoringChampionship,
  };

  // Compute canDuplicate for the editor
  const bracketCount = isOwner
    ? await getBracketEntryCountForUser(
        poolId,
        session.user.id,
        entry.tournamentId,
      )
    : 0;
  const canDuplicate =
    isOwner &&
    !tournamentStarted &&
    bracketCount < poolData.pool.maxBracketsPerUser;

  // Get rank info and elimination status for this bracket (only for submitted entries)
  let rankInfo: { rank: number; totalEntries: number } | null = null;
  let eliminationInfo: {
    isEliminated: boolean;
    leaderPoints: number;
    potentialPoints: number;
  } | null = null;
  if (entry.status === "submitted") {
    const { standings, scenarioData } = await getPoolStandings(
      poolId,
      entry.tournamentId,
      poolScoring,
    );
    const standing = standings.find((s) => s.id === bracketId);
    if (standing) {
      rankInfo = { rank: standing.rank, totalEntries: standings.length };
    }

    if (tournamentStarted && standings.length > 0) {
      const eliminationMap = scenarioData
        ? getScenarioEliminationStatus(standings, scenarioData, poolScoring, 1)
        : getEliminationStatus(standings, 1);
      const idx = standings.findIndex((s) => s.id === bracketId);
      if (idx !== -1) {
        const leaderPoints = Math.max(...standings.map((s) => s.totalPoints));
        eliminationInfo = {
          isEliminated: eliminationMap.get(idx) ?? false,
          leaderPoints,
          potentialPoints: standings[idx].potentialPoints,
        };
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {isOwner ? (
        <BracketEditor
          bracketEntryId={bracketId}
          bracketName={entry.name}
          bracketStatus={entry.status}
          tiebreakerScore={entry.tiebreakerScore}
          games={games}
          tournamentTeams={tournamentTeams}
          initialPicks={bracketPicks}
          poolId={poolId}
          bracketPositions={bracketPositions}
          tournamentStarted={tournamentStarted}
          bracketLockTime={bracketLockTime?.toISOString() ?? null}
          poolScoring={poolScoring}
          poolName={poolData.pool.name}
          rankInfo={rankInfo}
          canDuplicate={canDuplicate}
          eliminationInfo={eliminationInfo}
        />
      ) : (
        <BracketViewer
          bracketName={entry.name}
          bracketStatus={entry.status}
          totalPoints={entry.totalPoints}
          potentialPoints={entry.potentialPoints}
          games={games}
          tournamentTeams={tournamentTeams}
          picks={bracketPicks}
          bracketPositions={bracketPositions}
          poolScoring={poolScoring}
          poolId={poolId}
          poolName={poolData.pool.name}
          rankInfo={rankInfo}
          eliminationInfo={eliminationInfo}
          tiebreakerScore={entry.tiebreakerScore}
        />
      )}
    </div>
  );
}
