import { eq, desc, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tournament,
  tournamentTeam,
  tournamentGame,
  team,
} from "@/lib/db/schema";

export async function getTournaments() {
  return db.select().from(tournament).orderBy(desc(tournament.year));
}

export async function getTournamentById(id: string) {
  const [result] = await db
    .select()
    .from(tournament)
    .where(eq(tournament.id, id));
  return result ?? null;
}

export async function getActiveTournament() {
  const [result] = await db
    .select()
    .from(tournament)
    .where(eq(tournament.isActive, true));
  return result ?? null;
}

export async function createTournament(data: {
  name: string;
  year: number;
  isActive?: boolean;
}) {
  return db.transaction(async (tx) => {
    if (data.isActive) {
      await tx
        .update(tournament)
        .set({ isActive: false })
        .where(eq(tournament.isActive, true));
    }
    const [result] = await tx.insert(tournament).values(data).returning();
    return result;
  });
}

export async function updateTournament(
  id: string,
  data: {
    name?: string;
    year?: number;
    isActive?: boolean;
    bracketTopLeftRegion?: "south" | "east" | "west" | "midwest" | null;
    bracketBottomLeftRegion?: "south" | "east" | "west" | "midwest" | null;
    bracketTopRightRegion?: "south" | "east" | "west" | "midwest" | null;
    bracketBottomRightRegion?: "south" | "east" | "west" | "midwest" | null;
    bracketLockTime?: Date | null;
    bracketLockTimeManual?: boolean;
  },
) {
  return db.transaction(async (tx) => {
    if (data.isActive) {
      await tx
        .update(tournament)
        .set({ isActive: false })
        .where(and(eq(tournament.isActive, true), ne(tournament.id, id)));
    }
    const [result] = await tx
      .update(tournament)
      .set(data)
      .where(eq(tournament.id, id))
      .returning();
    return result ?? null;
  });
}

export async function deleteTournament(id: string) {
  await db.delete(tournament).where(eq(tournament.id, id));
}

export async function getTournamentTeams(tournamentId: string) {
  return db
    .select({
      id: tournamentTeam.id,
      tournamentId: tournamentTeam.tournamentId,
      teamId: tournamentTeam.teamId,
      seed: tournamentTeam.seed,
      region: tournamentTeam.region,
      teamName: team.name,
      teamShortName: team.shortName,
      teamAbbreviation: team.abbreviation,
      teamMascot: team.mascot,
      teamLogoUrl: team.logoUrl,
      teamDarkLogoUrl: team.darkLogoUrl,
      overallWins: tournamentTeam.overallWins,
      overallLosses: tournamentTeam.overallLosses,
      conferenceWins: tournamentTeam.conferenceWins,
      conferenceLosses: tournamentTeam.conferenceLosses,
      conferenceName: tournamentTeam.conferenceName,
      ppg: tournamentTeam.ppg,
      oppPpg: tournamentTeam.oppPpg,
      fgPct: tournamentTeam.fgPct,
      threePtPct: tournamentTeam.threePtPct,
      ftPct: tournamentTeam.ftPct,
      reboundsPerGame: tournamentTeam.reboundsPerGame,
      assistsPerGame: tournamentTeam.assistsPerGame,
      stealsPerGame: tournamentTeam.stealsPerGame,
      blocksPerGame: tournamentTeam.blocksPerGame,
      turnoversPerGame: tournamentTeam.turnoversPerGame,
      apRanking: tournamentTeam.apRanking,
      strengthOfSchedule: tournamentTeam.strengthOfSchedule,
      strengthOfScheduleRank: tournamentTeam.strengthOfScheduleRank,
      strengthOfRecord: tournamentTeam.strengthOfRecord,
      strengthOfRecordRank: tournamentTeam.strengthOfRecordRank,
      bpi: tournamentTeam.bpi,
      bpiOffense: tournamentTeam.bpiOffense,
      bpiDefense: tournamentTeam.bpiDefense,
      bpiRank: tournamentTeam.bpiRank,
      bpiOffenseRank: tournamentTeam.bpiOffenseRank,
      bpiDefenseRank: tournamentTeam.bpiDefenseRank,
    })
    .from(tournamentTeam)
    .innerJoin(team, eq(tournamentTeam.teamId, team.id))
    .where(eq(tournamentTeam.tournamentId, tournamentId))
    .orderBy(tournamentTeam.region, tournamentTeam.seed);
}

export async function addTeamToTournament(data: {
  tournamentId: string;
  teamId: string;
  seed: number;
  region: "south" | "east" | "west" | "midwest";
}) {
  const [result] = await db.insert(tournamentTeam).values(data).returning();
  return result;
}

export async function updateTournamentTeam(
  id: string,
  data: {
    seed: number;
    region: "south" | "east" | "west" | "midwest";
  },
) {
  const [result] = await db
    .update(tournamentTeam)
    .set(data)
    .where(eq(tournamentTeam.id, id))
    .returning();
  return result ?? null;
}

export async function removeTeamFromTournament(id: string) {
  await db.delete(tournamentTeam).where(eq(tournamentTeam.id, id));
}

export async function updateTournamentTeamStats(
  id: string,
  data: {
    overallWins?: number | null;
    overallLosses?: number | null;
    conferenceWins?: number | null;
    conferenceLosses?: number | null;
    conferenceName?: string | null;
    ppg?: number | null;
    oppPpg?: number | null;
    fgPct?: number | null;
    threePtPct?: number | null;
    ftPct?: number | null;
    reboundsPerGame?: number | null;
    assistsPerGame?: number | null;
    stealsPerGame?: number | null;
    blocksPerGame?: number | null;
    turnoversPerGame?: number | null;
    apRanking?: number | null;
    strengthOfSchedule?: number | null;
    strengthOfScheduleRank?: number | null;
    strengthOfRecord?: number | null;
    strengthOfRecordRank?: number | null;
    bpi?: number | null;
    bpiOffense?: number | null;
    bpiDefense?: number | null;
    bpiRank?: number | null;
    bpiOffenseRank?: number | null;
    bpiDefenseRank?: number | null;
  },
) {
  const [result] = await db
    .update(tournamentTeam)
    .set(data)
    .where(eq(tournamentTeam.id, id))
    .returning();
  return result ?? null;
}

export async function isTournamentComplete(
  tournamentId: string,
): Promise<boolean> {
  const games = await db
    .select({ status: tournamentGame.status })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));
  if (games.length === 0) return false;
  return games.every((g) => g.status === "final");
}

export async function getTournamentGames(tournamentId: string) {
  return db
    .select({
      id: tournamentGame.id,
      tournamentId: tournamentGame.tournamentId,
      round: tournamentGame.round,
      region: tournamentGame.region,
      gameNumber: tournamentGame.gameNumber,
      team1Id: tournamentGame.team1Id,
      team2Id: tournamentGame.team2Id,
      team1Score: tournamentGame.team1Score,
      team2Score: tournamentGame.team2Score,
      winnerTeamId: tournamentGame.winnerTeamId,
      status: tournamentGame.status,
      statusDetail: tournamentGame.statusDetail,
      startTime: tournamentGame.startTime,
      venueName: tournamentGame.venueName,
      venueCity: tournamentGame.venueCity,
      venueState: tournamentGame.venueState,
      sourceGame1Id: tournamentGame.sourceGame1Id,
      sourceGame2Id: tournamentGame.sourceGame2Id,
    })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId))
    .orderBy(
      tournamentGame.round,
      tournamentGame.region,
      tournamentGame.gameNumber,
    );
}
