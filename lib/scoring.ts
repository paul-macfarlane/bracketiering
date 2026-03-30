export const DEFAULT_SCORING = {
  firstFour: 0,
  round64: 1,
  round32: 2,
  sweet16: 4,
  elite8: 8,
  finalFour: 16,
  championship: 32,
} as const;

export interface PoolScoring {
  scoringFirstFour: number;
  scoringRound64: number;
  scoringRound32: number;
  scoringSweet16: number;
  scoringElite8: number;
  scoringFinalFour: number;
  scoringChampionship: number;
}

const ROUND_TO_SCORING_KEY: Record<string, keyof PoolScoring> = {
  first_four: "scoringFirstFour",
  round_of_64: "scoringRound64",
  round_of_32: "scoringRound32",
  sweet_16: "scoringSweet16",
  elite_8: "scoringElite8",
  final_four: "scoringFinalFour",
  championship: "scoringChampionship",
};

export function getPointsForRound(
  round: string,
  poolScoring: PoolScoring,
): number {
  const key = ROUND_TO_SCORING_KEY[round];
  return key ? poolScoring[key] : 0;
}

interface GameForScoring {
  id: string;
  round: string;
  winnerTeamId: string | null;
  status: string;
  team1Id: string | null;
  team2Id: string | null;
}

interface PickForScoring {
  tournamentGameId: string;
  pickedTeamId: string;
}

export function calculateBracketScores(
  games: GameForScoring[],
  picks: PickForScoring[],
  poolScoring: PoolScoring,
): { totalPoints: number; potentialPoints: number } {
  const picksByGame = new Map(picks.map((p) => [p.tournamentGameId, p]));

  // Build set of eliminated teams (lost in a completed game)
  const eliminatedTeams = new Set<string>();
  for (const game of games) {
    if (game.status === "final" && game.winnerTeamId) {
      if (game.team1Id && game.team1Id !== game.winnerTeamId) {
        eliminatedTeams.add(game.team1Id);
      }
      if (game.team2Id && game.team2Id !== game.winnerTeamId) {
        eliminatedTeams.add(game.team2Id);
      }
    }
  }

  let totalPoints = 0;
  let potentialPoints = 0;

  for (const game of games) {
    const pick = picksByGame.get(game.id);
    if (!pick) continue;

    const roundPoints = getPointsForRound(game.round, poolScoring);

    if (game.status === "final" && game.winnerTeamId) {
      if (pick.pickedTeamId === game.winnerTeamId) {
        totalPoints += roundPoints;
        potentialPoints += roundPoints;
      }
      // Incorrect pick: 0 points, 0 potential
    } else {
      // Game not yet decided — add to potential if team is still alive
      if (!eliminatedTeams.has(pick.pickedTeamId)) {
        potentialPoints += roundPoints;
      }
    }
  }

  return { totalPoints, potentialPoints };
}

export interface StandingsEntry {
  name: string;
  totalPoints: number;
  potentialPoints: number;
  tiebreakerDiff: number | null;
}

export function sortAndRankStandings<T extends StandingsEntry>(
  entries: T[],
): (T & { rank: number })[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.potentialPoints !== a.potentialPoints)
      return b.potentialPoints - a.potentialPoints;
    if (a.tiebreakerDiff !== null && b.tiebreakerDiff !== null) {
      if (a.tiebreakerDiff !== b.tiebreakerDiff)
        return a.tiebreakerDiff - b.tiebreakerDiff;
    }
    return a.name.localeCompare(b.name);
  });

  const ranked: (T & { rank: number })[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    let rank = i + 1;
    if (i > 0) {
      const prev = sorted[i - 1];
      if (
        entry.totalPoints === prev.totalPoints &&
        entry.potentialPoints === prev.potentialPoints &&
        entry.tiebreakerDiff === prev.tiebreakerDiff
      ) {
        rank = ranked[i - 1].rank;
      }
    }
    ranked.push({ ...entry, rank });
  }

  return ranked;
}

/**
 * Determines which entries are eliminated from finishing in the top N.
 * An entry is eliminated when N or more other entries already have totalPoints
 * strictly greater than this entry's potentialPoints.
 */
export function getEliminationStatus<
  T extends { totalPoints: number; potentialPoints: number },
>(entries: T[], topN: number = 1): Map<number, boolean> {
  const result = new Map<number, boolean>();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const countBeatBy = entries.filter(
      (e) => e.totalPoints > entry.potentialPoints,
    ).length;
    result.set(i, countBeatBy >= topN);
  }
  return result;
}

// --- Scenario-based elimination (Final Four onward) ---

export interface RemainingGame {
  id: string;
  round: string;
  team1Id: string | null;
  team2Id: string | null;
  /** For championship: the game whose winner becomes team1 */
  team1SourceGameId: string | null;
  /** For championship: the game whose winner becomes team2 */
  team2SourceGameId: string | null;
}

export interface ScenarioData {
  remainingGames: RemainingGame[];
  /** entryId → { gameId → pickedTeamId } */
  entryPicks: Record<string, Record<string, string>>;
}

/** A single scenario: gameId → winnerId */
type Scenario = Map<string, string>;

/**
 * Check if we're in "Final Four mode": all Elite 8 games are final and
 * at least one Final Four or Championship game is still pending.
 */
export function isFinalFourMode(
  games: { round: string; status: string }[],
): boolean {
  const elite8Games = games.filter((g) => g.round === "elite_8");
  if (elite8Games.length === 0) return false;
  const allElite8Final = elite8Games.every((g) => g.status === "final");
  if (!allElite8Final) return false;

  const lateGames = games.filter(
    (g) => g.round === "final_four" || g.round === "championship",
  );
  return lateGames.some((g) => g.status !== "final");
}

/**
 * Enumerate all possible outcome scenarios for the remaining games.
 * Handles the dependency where championship teams come from Final Four winners.
 */
export function generateScenarios(remainingGames: RemainingGame[]): Scenario[] {
  const f4Games = remainingGames.filter((g) => g.round === "final_four");
  const champGame = remainingGames.find((g) => g.round === "championship");

  if (remainingGames.length === 0) return [];

  // Generate F4 outcome combinations
  let f4Combos: Scenario[] = [new Map()];
  for (const game of f4Games) {
    const next: Scenario[] = [];
    for (const combo of f4Combos) {
      if (game.team1Id) {
        const c1 = new Map(combo);
        c1.set(game.id, game.team1Id);
        next.push(c1);
      }
      if (game.team2Id) {
        const c2 = new Map(combo);
        c2.set(game.id, game.team2Id);
        next.push(c2);
      }
    }
    f4Combos = next;
  }

  if (!champGame) return f4Combos;

  // For each F4 combo, determine championship matchup and enumerate its outcomes
  const scenarios: Scenario[] = [];
  for (const combo of f4Combos) {
    // Determine championship teams from F4 winners or pre-existing teams
    const champTeam1 = champGame.team1SourceGameId
      ? (combo.get(champGame.team1SourceGameId) ?? champGame.team1Id)
      : champGame.team1Id;
    const champTeam2 = champGame.team2SourceGameId
      ? (combo.get(champGame.team2SourceGameId) ?? champGame.team2Id)
      : champGame.team2Id;

    const champOptions: string[] = [];
    if (champTeam1) champOptions.push(champTeam1);
    if (champTeam2) champOptions.push(champTeam2);

    for (const winner of champOptions) {
      const scenario = new Map(combo);
      scenario.set(champGame.id, winner);
      scenarios.push(scenario);
    }
  }

  return scenarios;
}

/**
 * Scenario-aware elimination: determines which entries are eliminated by
 * checking if there's ANY remaining-game outcome where they finish in top N.
 * Use this when in Final Four mode for accurate elimination detection that
 * accounts for correlated picks.
 */
export function getScenarioEliminationStatus<
  T extends {
    id: string;
    totalPoints: number;
    potentialPoints: number;
    name: string;
    tiebreakerDiff: number | null;
  },
>(
  entries: T[],
  scenarioData: ScenarioData,
  poolScoring: PoolScoring,
  topN: number = 1,
): Map<number, boolean> {
  const scenarios = generateScenarios(scenarioData.remainingGames);

  // If no scenarios (shouldn't happen if isFinalFourMode is true), fall back
  if (scenarios.length === 0) {
    return getEliminationStatus(entries, topN);
  }

  const result = new Map<number, boolean>();

  // Pre-compute each entry's picks for remaining games
  const entryPickMaps: Map<string, string>[] = entries.map((entry) => {
    const picks = scenarioData.entryPicks[entry.id] ?? {};
    return new Map(Object.entries(picks));
  });

  // Build a round lookup for remaining games
  const gameRoundMap = new Map(
    scenarioData.remainingGames.map((g) => [g.id, g.round]),
  );

  for (let i = 0; i < entries.length; i++) {
    let canFinishInTopN = false;

    for (const scenario of scenarios) {
      // Compute projected scores for all entries in this scenario
      const projected = entries.map((entry, j) => {
        let score = entry.totalPoints;
        const picks = entryPickMaps[j];
        for (const [gameId, winnerId] of scenario) {
          const pickedTeamId = picks.get(gameId);
          if (pickedTeamId === winnerId) {
            const round = gameRoundMap.get(gameId);
            if (round) {
              score += getPointsForRound(round, poolScoring);
            }
          }
        }
        return { name: entry.name, totalPoints: score };
      });

      // Count how many entries have strictly more points than entry i
      const myPoints = projected[i].totalPoints;
      let countAhead = 0;
      for (let j = 0; j < projected.length; j++) {
        if (j !== i && projected[j].totalPoints > myPoints) {
          countAhead++;
        }
      }
      // Ties: if tied on points, tiebreaker is unknown, so we conservatively
      // treat the entry as NOT behind (they could win the tiebreaker)
      if (countAhead < topN) {
        canFinishInTopN = true;
        break; // Found at least one scenario, no need to check more
      }
    }

    result.set(i, !canFinishInTopN);
  }

  return result;
}
