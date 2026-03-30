import { describe, it, expect } from "vitest";
import {
  calculateBracketScores,
  getEliminationStatus,
  getPointsForRound,
  sortAndRankStandings,
  isFinalFourMode,
  generateScenarios,
  getScenarioEliminationStatus,
  buildScenarioResults,
  computeScenarioSummaries,
  type PoolScoring,
  type StandingsEntry,
  type ScenarioData,
} from "./scoring";

const DEFAULT_SCORING: PoolScoring = {
  scoringFirstFour: 0,
  scoringRound64: 1,
  scoringRound32: 2,
  scoringSweet16: 4,
  scoringElite8: 8,
  scoringFinalFour: 16,
  scoringChampionship: 32,
};

// Helper to create a game
function makeGame(
  overrides: Partial<{
    id: string;
    round: string;
    winnerTeamId: string | null;
    status: string;
    team1Id: string | null;
    team2Id: string | null;
  }> = {},
) {
  return {
    id: "game-1",
    round: "round_of_64",
    winnerTeamId: null,
    status: "scheduled",
    team1Id: "team-a",
    team2Id: "team-b",
    ...overrides,
  };
}

describe("getPointsForRound", () => {
  it("returns correct points for each round", () => {
    expect(getPointsForRound("first_four", DEFAULT_SCORING)).toBe(0);
    expect(getPointsForRound("round_of_64", DEFAULT_SCORING)).toBe(1);
    expect(getPointsForRound("round_of_32", DEFAULT_SCORING)).toBe(2);
    expect(getPointsForRound("sweet_16", DEFAULT_SCORING)).toBe(4);
    expect(getPointsForRound("elite_8", DEFAULT_SCORING)).toBe(8);
    expect(getPointsForRound("final_four", DEFAULT_SCORING)).toBe(16);
    expect(getPointsForRound("championship", DEFAULT_SCORING)).toBe(32);
  });

  it("returns 0 for unknown round", () => {
    expect(getPointsForRound("unknown_round", DEFAULT_SCORING)).toBe(0);
  });

  it("uses custom scoring values", () => {
    const custom: PoolScoring = {
      ...DEFAULT_SCORING,
      scoringRound64: 10,
      scoringChampionship: 100,
    };
    expect(getPointsForRound("round_of_64", custom)).toBe(10);
    expect(getPointsForRound("championship", custom)).toBe(100);
  });
});

describe("calculateBracketScores", () => {
  describe("correct picks", () => {
    it("awards points for a correct R64 pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("awards points for a correct championship pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "championship",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(32);
      expect(result.potentialPoints).toBe(32);
    });

    it("accumulates points across multiple correct picks in different rounds", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
        makeGame({
          id: "g3",
          round: "sweet_16",
          status: "final",
          winnerTeamId: "team-e",
          team1Id: "team-e",
          team2Id: "team-f",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-c" },
        { tournamentGameId: "g3", pickedTeamId: "team-e" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      // 1 + 2 + 4 = 7
      expect(result.totalPoints).toBe(7);
      expect(result.potentialPoints).toBe(7);
    });
  });

  describe("incorrect picks", () => {
    it("awards 0 points for an incorrect pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("awards 0 potential for incorrect pick even in later rounds", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "championship",
          status: "final",
          winnerTeamId: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });
  });

  describe("pending games and potential points", () => {
    it("includes potential points for pending games with alive teams", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "scheduled",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(1);
    });

    it("excludes potential points when picked team is eliminated", () => {
      const games = [
        // Game where team-a lost (eliminated)
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-b",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        // Future game where user picked team-a
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-a" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      // g1: incorrect (0 potential), g2: team-a eliminated (0 potential)
      expect(result.potentialPoints).toBe(0);
    });

    it("includes potential for in-progress games", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "elite_8",
          status: "in_progress",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(8);
    });
  });

  describe("mixed scenario: correct, incorrect, and pending", () => {
    it("correctly computes a realistic bracket scenario", () => {
      const games = [
        // R64: correct pick
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        // R64: incorrect pick (team-c eliminated)
        makeGame({
          id: "g2",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-d",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
        // R32: pending, picked team-a (alive) → potential
        makeGame({
          id: "g3",
          round: "round_of_32",
          status: "scheduled",
          team1Id: "team-a",
          team2Id: "team-d",
        }),
        // S16: pending, picked team-c (eliminated) → no potential
        makeGame({
          id: "g4",
          round: "sweet_16",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
        // E8: pending, picked team-a (alive) → potential
        makeGame({
          id: "g5",
          round: "elite_8",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" }, // correct: +1
        { tournamentGameId: "g2", pickedTeamId: "team-c" }, // incorrect: +0
        { tournamentGameId: "g3", pickedTeamId: "team-a" }, // pending, alive: potential +2
        { tournamentGameId: "g4", pickedTeamId: "team-c" }, // pending, eliminated: potential +0
        { tournamentGameId: "g5", pickedTeamId: "team-a" }, // pending, alive: potential +8
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      // 1 (correct g1) + 2 (g3 potential) + 8 (g5 potential) = 11
      expect(result.potentialPoints).toBe(11);
    });
  });

  describe("edge cases", () => {
    it("returns 0/0 with no picks", () => {
      const games = [
        makeGame({ id: "g1", status: "final", winnerTeamId: "team-a" }),
      ];
      const result = calculateBracketScores(games, [], DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("returns 0/0 with no games", () => {
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];
      const result = calculateBracketScores([], picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("ignores picks for games that don't exist", () => {
      const games = [
        makeGame({
          id: "g1",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "nonexistent", pickedTeamId: "team-x" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("handles games with no picks gracefully", () => {
      const games = [
        makeGame({
          id: "g1",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("first four games score 0 points even when correct", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "first_four",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });
  });

  describe("custom scoring", () => {
    it("uses custom points per round", () => {
      const customScoring: PoolScoring = {
        scoringFirstFour: 5,
        scoringRound64: 10,
        scoringRound32: 20,
        scoringSweet16: 40,
        scoringElite8: 80,
        scoringFinalFour: 160,
        scoringChampionship: 320,
      };

      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "final_four",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-c" },
      ];

      const result = calculateBracketScores(games, picks, customScoring);
      expect(result.totalPoints).toBe(170); // 10 + 160
      expect(result.potentialPoints).toBe(170);
    });

    it("awards first four points when scoring is non-zero", () => {
      const customScoring: PoolScoring = {
        ...DEFAULT_SCORING,
        scoringFirstFour: 3,
      };

      const games = [
        makeGame({
          id: "g1",
          round: "first_four",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, customScoring);
      expect(result.totalPoints).toBe(3);
      expect(result.potentialPoints).toBe(3);
    });
  });

  describe("elimination tracking", () => {
    it("a team eliminated in one game loses potential in all future games", () => {
      const games = [
        // team-x loses in R64
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-y",
          team1Id: "team-x",
          team2Id: "team-y",
        }),
        // team-x picked in R32 (pending)
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
        }),
        // team-x picked in Sweet 16 (pending)
        makeGame({
          id: "g3",
          round: "sweet_16",
          status: "scheduled",
        }),
        // team-x picked in championship (pending)
        makeGame({
          id: "g4",
          round: "championship",
          status: "scheduled",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-x" },
        { tournamentGameId: "g2", pickedTeamId: "team-x" },
        { tournamentGameId: "g3", pickedTeamId: "team-x" },
        { tournamentGameId: "g4", pickedTeamId: "team-x" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      // All 0 because team-x is eliminated
      expect(result.potentialPoints).toBe(0);
    });

    it("only the losing team is eliminated, not the winner", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-a" }, // alive
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      // 1 (correct) + 2 (potential for g2, team-a alive) = 3
      expect(result.potentialPoints).toBe(3);
    });
  });

  describe("perfect bracket scenario", () => {
    it("calculates max possible score with default scoring", () => {
      // Simulate a perfect bracket: all 63 games correct with default scoring
      // R64: 32 games × 1 = 32
      // R32: 16 games × 2 = 32
      // S16: 8 games × 4 = 32
      // E8: 4 games × 8 = 32
      // F4: 2 games × 16 = 32
      // Championship: 1 game × 32 = 32
      // Total: 192

      const rounds = [
        { round: "round_of_64", count: 32 },
        { round: "round_of_32", count: 16 },
        { round: "sweet_16", count: 8 },
        { round: "elite_8", count: 4 },
        { round: "final_four", count: 2 },
        { round: "championship", count: 1 },
      ];

      const games: ReturnType<typeof makeGame>[] = [];
      const picks: { tournamentGameId: string; pickedTeamId: string }[] = [];
      let gameIdx = 0;

      for (const { round, count } of rounds) {
        for (let i = 0; i < count; i++) {
          const id = `g${gameIdx++}`;
          const winnerId = `team-${id}`;
          games.push(
            makeGame({
              id,
              round,
              status: "final",
              winnerTeamId: winnerId,
              team1Id: winnerId,
              team2Id: `loser-${id}`,
            }),
          );
          picks.push({ tournamentGameId: id, pickedTeamId: winnerId });
        }
      }

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(192);
      expect(result.potentialPoints).toBe(192);
    });
  });
});

// Helper for standings entries
function makeEntry(
  overrides: Partial<StandingsEntry> & { name: string },
): StandingsEntry {
  return {
    totalPoints: 0,
    potentialPoints: 0,
    tiebreakerDiff: null,
    ...overrides,
  };
}

describe("sortAndRankStandings", () => {
  describe("sorting", () => {
    it("sorts by total points descending", () => {
      const entries = [
        makeEntry({ name: "Low", totalPoints: 5 }),
        makeEntry({ name: "High", totalPoints: 20 }),
        makeEntry({ name: "Mid", totalPoints: 10 }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.name)).toEqual(["High", "Mid", "Low"]);
    });

    it("breaks ties with potential points descending", () => {
      const entries = [
        makeEntry({ name: "LowPot", totalPoints: 10, potentialPoints: 20 }),
        makeEntry({ name: "HighPot", totalPoints: 10, potentialPoints: 50 }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.name)).toEqual(["HighPot", "LowPot"]);
    });

    it("breaks ties with tiebreaker diff ascending (closer is better)", () => {
      const entries = [
        makeEntry({
          name: "Far",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 15,
        }),
        makeEntry({
          name: "Close",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 3,
        }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.name)).toEqual(["Close", "Far"]);
    });

    it("breaks all remaining ties alphabetically by name", () => {
      const entries = [
        makeEntry({
          name: "Zulu",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 5,
        }),
        makeEntry({
          name: "Alpha",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 5,
        }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.name)).toEqual(["Alpha", "Zulu"]);
    });

    it("handles null tiebreaker (championship not played) — falls through to name", () => {
      const entries = [
        makeEntry({
          name: "Bravo",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: null,
        }),
        makeEntry({
          name: "Alpha",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: null,
        }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.name)).toEqual(["Alpha", "Bravo"]);
    });

    it("handles mixed null and non-null tiebreaker diffs", () => {
      // When one has tiebreaker and the other doesn't, the comparison
      // (null !== null) is false so it falls through to name sort
      const entries = [
        makeEntry({
          name: "HasTB",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 5,
        }),
        makeEntry({
          name: "NoTB",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: null,
        }),
      ];
      const result = sortAndRankStandings(entries);
      // Falls through to alphabetical since tiebreaker comparison is skipped
      expect(result.map((e) => e.name)).toEqual(["HasTB", "NoTB"]);
    });
  });

  describe("ranking", () => {
    it("assigns sequential ranks for different scores", () => {
      const entries = [
        makeEntry({ name: "A", totalPoints: 30 }),
        makeEntry({ name: "B", totalPoints: 20 }),
        makeEntry({ name: "C", totalPoints: 10 }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.rank)).toEqual([1, 2, 3]);
    });

    it("assigns same rank for tied entries", () => {
      const entries = [
        makeEntry({
          name: "Alpha",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 5,
        }),
        makeEntry({
          name: "Bravo",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: 5,
        }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.rank)).toEqual([1, 1]);
    });

    it("skips rank correctly after ties (1, 1, 3 not 1, 1, 2)", () => {
      const entries = [
        makeEntry({
          name: "A",
          totalPoints: 20,
          potentialPoints: 20,
          tiebreakerDiff: 5,
        }),
        makeEntry({
          name: "B",
          totalPoints: 20,
          potentialPoints: 20,
          tiebreakerDiff: 5,
        }),
        makeEntry({ name: "C", totalPoints: 10 }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => ({ name: e.name, rank: e.rank }))).toEqual([
        { name: "A", rank: 1 },
        { name: "B", rank: 1 },
        { name: "C", rank: 3 },
      ]);
    });

    it("handles three-way tie followed by different score", () => {
      const entries = [
        makeEntry({
          name: "A",
          totalPoints: 15,
          potentialPoints: 15,
          tiebreakerDiff: null,
        }),
        makeEntry({
          name: "B",
          totalPoints: 15,
          potentialPoints: 15,
          tiebreakerDiff: null,
        }),
        makeEntry({
          name: "C",
          totalPoints: 15,
          potentialPoints: 15,
          tiebreakerDiff: null,
        }),
        makeEntry({ name: "D", totalPoints: 5 }),
      ];
      const result = sortAndRankStandings(entries);
      expect(result.map((e) => e.rank)).toEqual([1, 1, 1, 4]);
    });

    it("single entry gets rank 1", () => {
      const entries = [makeEntry({ name: "Solo", totalPoints: 42 })];
      const result = sortAndRankStandings(entries);
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
    });

    it("returns empty array for no entries", () => {
      const result = sortAndRankStandings([]);
      expect(result).toEqual([]);
    });
  });

  describe("preserves extra properties", () => {
    it("passes through additional fields on entries", () => {
      const entries = [
        {
          name: "A",
          totalPoints: 10,
          potentialPoints: 10,
          tiebreakerDiff: null,
          userId: "u1",
        },
        {
          name: "B",
          totalPoints: 5,
          potentialPoints: 5,
          tiebreakerDiff: null,
          userId: "u2",
        },
      ];
      const result = sortAndRankStandings(entries);
      expect(result[0].userId).toBe("u1");
      expect(result[1].userId).toBe("u2");
    });
  });
});

describe("full tournament scenarios", () => {
  // Full 8-team single-elimination bracket for one half of a region
  // R64 (4 games) → R32 (2 games) → S16 (1 game)
  function buildHalfRegion(
    teamIds: string[],
    gameResults: {
      round: string;
      gameIndex: number;
      winner: 0 | 1;
      status: string;
    }[],
  ) {
    // 8 teams → 4 R64 games → 2 R32 games → 1 S16 game
    const games: ReturnType<typeof makeGame>[] = [];
    const resultMap = new Map(
      gameResults.map((r) => [`${r.round}-${r.gameIndex}`, r]),
    );

    // R64: 4 games
    const r64Winners: (string | null)[] = [];
    for (let i = 0; i < 4; i++) {
      const t1 = teamIds[i * 2];
      const t2 = teamIds[i * 2 + 1];
      const res = resultMap.get(`round_of_64-${i}`);
      const status = res?.status ?? "scheduled";
      const winner = status === "final" ? (res?.winner === 0 ? t1 : t2) : null;
      r64Winners.push(winner);
      games.push(
        makeGame({
          id: `r64-${i}`,
          round: "round_of_64",
          status,
          winnerTeamId: winner,
          team1Id: t1,
          team2Id: t2,
        }),
      );
    }

    // R32: 2 games
    const r32Winners: (string | null)[] = [];
    for (let i = 0; i < 2; i++) {
      const t1 = r64Winners[i * 2];
      const t2 = r64Winners[i * 2 + 1];
      const res = resultMap.get(`round_of_32-${i}`);
      const status = res?.status ?? "scheduled";
      const winner = status === "final" ? (res?.winner === 0 ? t1 : t2) : null;
      r32Winners.push(winner);
      games.push(
        makeGame({
          id: `r32-${i}`,
          round: "round_of_32",
          status,
          winnerTeamId: winner,
          team1Id: t1,
          team2Id: t2,
        }),
      );
    }

    // S16: 1 game
    const res = resultMap.get("sweet_16-0");
    const s16Status = res?.status ?? "scheduled";
    const s16Winner =
      s16Status === "final"
        ? res?.winner === 0
          ? r32Winners[0]
          : r32Winners[1]
        : null;
    games.push(
      makeGame({
        id: "s16-0",
        round: "sweet_16",
        status: s16Status,
        winnerTeamId: s16Winner,
        team1Id: r32Winners[0],
        team2Id: r32Winners[1],
      }),
    );

    return { games, teamIds };
  }

  it("early tournament: R64 half done, everyone has high potential", () => {
    // 8 teams, only first 2 of 4 R64 games are final
    const teams = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
    const { games } = buildHalfRegion(teams, [
      { round: "round_of_64", gameIndex: 0, winner: 0, status: "final" }, // t1 wins
      { round: "round_of_64", gameIndex: 1, winner: 1, status: "final" }, // t4 wins
    ]);

    // Entry A: picked t1, t4 (both correct), picks t1 going deep
    const picksA = [
      { tournamentGameId: "r64-0", pickedTeamId: "t1" },
      { tournamentGameId: "r64-1", pickedTeamId: "t4" },
      { tournamentGameId: "r64-2", pickedTeamId: "t5" }, // pending
      { tournamentGameId: "r64-3", pickedTeamId: "t7" }, // pending
      { tournamentGameId: "r32-0", pickedTeamId: "t1" }, // pending, alive
      { tournamentGameId: "r32-1", pickedTeamId: "t5" }, // pending, alive
      { tournamentGameId: "s16-0", pickedTeamId: "t1" }, // pending, alive
    ];

    // Entry B: picked t2, t3 (both wrong), t2 eliminated
    const picksB = [
      { tournamentGameId: "r64-0", pickedTeamId: "t2" },
      { tournamentGameId: "r64-1", pickedTeamId: "t3" },
      { tournamentGameId: "r64-2", pickedTeamId: "t6" }, // pending
      { tournamentGameId: "r64-3", pickedTeamId: "t8" }, // pending
      { tournamentGameId: "r32-0", pickedTeamId: "t2" }, // eliminated
      { tournamentGameId: "r32-1", pickedTeamId: "t6" }, // pending, alive
      { tournamentGameId: "s16-0", pickedTeamId: "t2" }, // eliminated
    ];

    const scoreA = calculateBracketScores(games, picksA, DEFAULT_SCORING);
    const scoreB = calculateBracketScores(games, picksB, DEFAULT_SCORING);

    // A: 1 + 1 correct = 2 points, potential: 2 + 1 + 1 + 2 + 2 + 4 = 12
    expect(scoreA.totalPoints).toBe(2);
    expect(scoreA.potentialPoints).toBe(12);

    // B: 0 correct, potential: 0 + 0 + 1 + 1 + 0 + 2 + 0 = 4
    expect(scoreB.totalPoints).toBe(0);
    expect(scoreB.potentialPoints).toBe(4);

    const standings = sortAndRankStandings([
      { ...scoreA, name: "Entry A", tiebreakerDiff: null },
      { ...scoreB, name: "Entry B", tiebreakerDiff: null },
    ]);

    expect(standings[0].name).toBe("Entry A");
    expect(standings[0].rank).toBe(1);
    expect(standings[1].name).toBe("Entry B");
    expect(standings[1].rank).toBe(2);
  });

  it("mid tournament: S16 complete, some entries busted", () => {
    // All R64, R32, and S16 are final
    const teams = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
    const { games } = buildHalfRegion(teams, [
      { round: "round_of_64", gameIndex: 0, winner: 0, status: "final" }, // t1
      { round: "round_of_64", gameIndex: 1, winner: 0, status: "final" }, // t3
      { round: "round_of_64", gameIndex: 2, winner: 1, status: "final" }, // t6 (upset)
      { round: "round_of_64", gameIndex: 3, winner: 1, status: "final" }, // t8 (upset)
      { round: "round_of_32", gameIndex: 0, winner: 0, status: "final" }, // t1
      { round: "round_of_32", gameIndex: 1, winner: 1, status: "final" }, // t8 (upset)
      { round: "sweet_16", gameIndex: 0, winner: 0, status: "final" }, // t1
    ]);

    // Entry "Chalk": picked all favorites (t1, t3, t5, t7, t1, t5, t1)
    const picksChalk = [
      { tournamentGameId: "r64-0", pickedTeamId: "t1" }, // correct
      { tournamentGameId: "r64-1", pickedTeamId: "t3" }, // correct
      { tournamentGameId: "r64-2", pickedTeamId: "t5" }, // wrong
      { tournamentGameId: "r64-3", pickedTeamId: "t7" }, // wrong
      { tournamentGameId: "r32-0", pickedTeamId: "t1" }, // correct
      { tournamentGameId: "r32-1", pickedTeamId: "t5" }, // wrong (t5 eliminated)
      { tournamentGameId: "s16-0", pickedTeamId: "t1" }, // correct
    ];

    // Entry "Upsets": picked underdogs (t2, t4, t6, t8, t2, t8, t8)
    const picksUpsets = [
      { tournamentGameId: "r64-0", pickedTeamId: "t2" }, // wrong
      { tournamentGameId: "r64-1", pickedTeamId: "t4" }, // wrong
      { tournamentGameId: "r64-2", pickedTeamId: "t6" }, // correct
      { tournamentGameId: "r64-3", pickedTeamId: "t8" }, // correct
      { tournamentGameId: "r32-0", pickedTeamId: "t2" }, // wrong (eliminated)
      { tournamentGameId: "r32-1", pickedTeamId: "t8" }, // correct
      { tournamentGameId: "s16-0", pickedTeamId: "t8" }, // wrong
    ];

    const chalkScore = calculateBracketScores(
      games,
      picksChalk,
      DEFAULT_SCORING,
    );
    const upsetsScore = calculateBracketScores(
      games,
      picksUpsets,
      DEFAULT_SCORING,
    );

    // Chalk: R64: 1+1+0+0=2, R32: 2+0=2, S16: 4 → total 8, all final → potential = total
    expect(chalkScore.totalPoints).toBe(8);
    expect(chalkScore.potentialPoints).toBe(8);

    // Upsets: R64: 0+0+1+1=2, R32: 0+2=2, S16: 0 → total 4
    expect(upsetsScore.totalPoints).toBe(4);
    expect(upsetsScore.potentialPoints).toBe(4);

    const standings = sortAndRankStandings([
      { ...chalkScore, name: "Chalk", tiebreakerDiff: null },
      { ...upsetsScore, name: "Upsets", tiebreakerDiff: null },
    ]);

    expect(standings[0].name).toBe("Chalk");
    expect(standings[1].name).toBe("Upsets");
  });

  it("complete tournament: tiebreaker decides winner", () => {
    // Simple 4-team bracket: 2 R64 + 1 championship, all final
    const games = [
      makeGame({
        id: "r64-1",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "duke",
        team1Id: "duke",
        team2Id: "unc",
      }),
      makeGame({
        id: "r64-2",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "kansas",
        team1Id: "kansas",
        team2Id: "kentucky",
      }),
      makeGame({
        id: "champ",
        round: "championship",
        status: "final",
        winnerTeamId: "duke",
        team1Id: "duke",
        team2Id: "kansas",
      }),
    ];

    // Both entries pick all games correctly (same points)
    const picksA = [
      { tournamentGameId: "r64-1", pickedTeamId: "duke" },
      { tournamentGameId: "r64-2", pickedTeamId: "kansas" },
      { tournamentGameId: "champ", pickedTeamId: "duke" },
    ];
    const picksB = [...picksA]; // Same picks

    const scoreA = calculateBracketScores(games, picksA, DEFAULT_SCORING);
    const scoreB = calculateBracketScores(games, picksB, DEFAULT_SCORING);

    // Both: 1 + 1 + 32 = 34
    expect(scoreA.totalPoints).toBe(34);
    expect(scoreB.totalPoints).toBe(34);

    // Entry A predicted championship total 145, Entry B predicted 160
    // Actual total was 150 (duke 80, kansas 70)
    const standings = sortAndRankStandings([
      { ...scoreA, name: "Entry A", tiebreakerDiff: Math.abs(145 - 150) }, // diff 5
      { ...scoreB, name: "Entry B", tiebreakerDiff: Math.abs(160 - 150) }, // diff 10
    ]);

    expect(standings[0].name).toBe("Entry A");
    expect(standings[0].rank).toBe(1);
    expect(standings[1].name).toBe("Entry B");
    expect(standings[1].rank).toBe(2);
  });

  it("upset-heavy tournament: chalk brackets busted, underdog picker leads", () => {
    // 4 R64 games, all upsets (team2 wins)
    const games = [
      makeGame({
        id: "g1",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "t2",
        team1Id: "t1",
        team2Id: "t2",
      }),
      makeGame({
        id: "g2",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "t4",
        team1Id: "t3",
        team2Id: "t4",
      }),
      makeGame({
        id: "g3",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "t6",
        team1Id: "t5",
        team2Id: "t6",
      }),
      makeGame({
        id: "g4",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "t8",
        team1Id: "t7",
        team2Id: "t8",
      }),
      // R32 games pending
      makeGame({
        id: "g5",
        round: "round_of_32",
        status: "scheduled",
        team1Id: "t2",
        team2Id: "t4",
      }),
      makeGame({
        id: "g6",
        round: "round_of_32",
        status: "scheduled",
        team1Id: "t6",
        team2Id: "t8",
      }),
    ];

    // Chalk picker: picked all favorites (all wrong)
    const picksChalk = [
      { tournamentGameId: "g1", pickedTeamId: "t1" },
      { tournamentGameId: "g2", pickedTeamId: "t3" },
      { tournamentGameId: "g3", pickedTeamId: "t5" },
      { tournamentGameId: "g4", pickedTeamId: "t7" },
      { tournamentGameId: "g5", pickedTeamId: "t1" }, // eliminated
      { tournamentGameId: "g6", pickedTeamId: "t5" }, // eliminated
    ];

    // Underdog picker: picked all underdogs (all correct)
    const picksUnderdog = [
      { tournamentGameId: "g1", pickedTeamId: "t2" },
      { tournamentGameId: "g2", pickedTeamId: "t4" },
      { tournamentGameId: "g3", pickedTeamId: "t6" },
      { tournamentGameId: "g4", pickedTeamId: "t8" },
      { tournamentGameId: "g5", pickedTeamId: "t2" }, // alive
      { tournamentGameId: "g6", pickedTeamId: "t6" }, // alive
    ];

    // Mixed picker: 2 correct, 2 wrong
    const picksMixed = [
      { tournamentGameId: "g1", pickedTeamId: "t2" }, // correct
      { tournamentGameId: "g2", pickedTeamId: "t3" }, // wrong
      { tournamentGameId: "g3", pickedTeamId: "t6" }, // correct
      { tournamentGameId: "g4", pickedTeamId: "t7" }, // wrong
      { tournamentGameId: "g5", pickedTeamId: "t2" }, // alive
      { tournamentGameId: "g6", pickedTeamId: "t6" }, // alive
    ];

    const chalkScore = calculateBracketScores(
      games,
      picksChalk,
      DEFAULT_SCORING,
    );
    const underdogScore = calculateBracketScores(
      games,
      picksUnderdog,
      DEFAULT_SCORING,
    );
    const mixedScore = calculateBracketScores(
      games,
      picksMixed,
      DEFAULT_SCORING,
    );

    // Chalk: 0 points, 0 potential (all favorites eliminated)
    expect(chalkScore.totalPoints).toBe(0);
    expect(chalkScore.potentialPoints).toBe(0);

    // Underdog: 4 points (4×1), potential: 4 + 2 + 2 = 8
    expect(underdogScore.totalPoints).toBe(4);
    expect(underdogScore.potentialPoints).toBe(8);

    // Mixed: 2 points (2×1), potential: 2 + 2 + 2 = 6
    expect(mixedScore.totalPoints).toBe(2);
    expect(mixedScore.potentialPoints).toBe(6);

    const standings = sortAndRankStandings([
      { ...chalkScore, name: "Chalk", tiebreakerDiff: null },
      { ...underdogScore, name: "Underdog", tiebreakerDiff: null },
      { ...mixedScore, name: "Mixed", tiebreakerDiff: null },
    ]);

    expect(standings.map((s) => s.name)).toEqual([
      "Underdog",
      "Mixed",
      "Chalk",
    ]);
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it("late tournament: F4, close race with tiebreaker not yet available", () => {
    // Simulate a condensed late-tournament state:
    // 4 R64 final, 2 R32 final, 1 S16 final, 1 E8 final, F4 + championship pending
    const games = [
      // R64 — all final
      makeGame({
        id: "r64-1",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "duke",
        team1Id: "duke",
        team2Id: "unc",
      }),
      makeGame({
        id: "r64-2",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "kansas",
        team1Id: "kansas",
        team2Id: "baylor",
      }),
      makeGame({
        id: "r64-3",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "uconn",
        team1Id: "uconn",
        team2Id: "purdue",
      }),
      makeGame({
        id: "r64-4",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "houston",
        team1Id: "houston",
        team2Id: "auburn",
      }),
      // R32 — all final
      makeGame({
        id: "r32-1",
        round: "round_of_32",
        status: "final",
        winnerTeamId: "duke",
        team1Id: "duke",
        team2Id: "kansas",
      }),
      makeGame({
        id: "r32-2",
        round: "round_of_32",
        status: "final",
        winnerTeamId: "uconn",
        team1Id: "uconn",
        team2Id: "houston",
      }),
      // S16 — final
      makeGame({
        id: "s16-1",
        round: "sweet_16",
        status: "final",
        winnerTeamId: "duke",
        team1Id: "duke",
        team2Id: "uconn",
      }),
      // E8 — pending
      makeGame({
        id: "e8-1",
        round: "elite_8",
        status: "scheduled",
        team1Id: "duke",
        team2Id: null,
      }),
      // F4 — pending
      makeGame({
        id: "f4-1",
        round: "final_four",
        status: "scheduled",
        team1Id: null,
        team2Id: null,
      }),
      // Championship — pending
      makeGame({
        id: "champ",
        round: "championship",
        status: "scheduled",
        team1Id: null,
        team2Id: null,
      }),
    ];

    // Entry 1: Picked duke all the way (duke still alive)
    const picks1 = [
      { tournamentGameId: "r64-1", pickedTeamId: "duke" },
      { tournamentGameId: "r64-2", pickedTeamId: "kansas" },
      { tournamentGameId: "r64-3", pickedTeamId: "uconn" },
      { tournamentGameId: "r64-4", pickedTeamId: "houston" },
      { tournamentGameId: "r32-1", pickedTeamId: "duke" },
      { tournamentGameId: "r32-2", pickedTeamId: "uconn" },
      { tournamentGameId: "s16-1", pickedTeamId: "duke" },
      { tournamentGameId: "e8-1", pickedTeamId: "duke" },
      { tournamentGameId: "f4-1", pickedTeamId: "duke" },
      { tournamentGameId: "champ", pickedTeamId: "duke" },
    ];

    // Entry 2: Picked similar but had uconn winning S16
    const picks2 = [
      { tournamentGameId: "r64-1", pickedTeamId: "duke" },
      { tournamentGameId: "r64-2", pickedTeamId: "kansas" },
      { tournamentGameId: "r64-3", pickedTeamId: "uconn" },
      { tournamentGameId: "r64-4", pickedTeamId: "houston" },
      { tournamentGameId: "r32-1", pickedTeamId: "duke" },
      { tournamentGameId: "r32-2", pickedTeamId: "uconn" },
      { tournamentGameId: "s16-1", pickedTeamId: "uconn" }, // wrong
      { tournamentGameId: "e8-1", pickedTeamId: "uconn" }, // eliminated
      { tournamentGameId: "f4-1", pickedTeamId: "uconn" }, // eliminated
      { tournamentGameId: "champ", pickedTeamId: "uconn" }, // eliminated
    ];

    const score1 = calculateBracketScores(games, picks1, DEFAULT_SCORING);
    const score2 = calculateBracketScores(games, picks2, DEFAULT_SCORING);

    // Entry 1: R64: 4×1=4, R32: 2×2=4, S16: 4 = 12 earned
    // Potential: 12 + 8(E8) + 16(F4) + 32(champ) = 68
    expect(score1.totalPoints).toBe(12);
    expect(score1.potentialPoints).toBe(68);

    // Entry 2: R64: 4×1=4, R32: 2×2=4, S16: 0 = 8 earned
    // uconn eliminated, so E8/F4/champ picks are dead
    // Potential: 8 + 0 + 0 + 0 = 8
    expect(score2.totalPoints).toBe(8);
    expect(score2.potentialPoints).toBe(8);

    const standings = sortAndRankStandings([
      { ...score1, name: "Duke Fan", tiebreakerDiff: null },
      { ...score2, name: "UConn Fan", tiebreakerDiff: null },
    ]);

    expect(standings[0].name).toBe("Duke Fan");
    expect(standings[1].name).toBe("UConn Fan");
  });

  it("multi-entry pool: 5 entries with varied strategies produce correct standings", () => {
    // 4 R64 games (all final) + 2 R32 games (1 final, 1 pending)
    const games = [
      makeGame({
        id: "g1",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "A",
        team1Id: "A",
        team2Id: "B",
      }),
      makeGame({
        id: "g2",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "C",
        team1Id: "C",
        team2Id: "D",
      }),
      makeGame({
        id: "g3",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "F",
        team1Id: "E",
        team2Id: "F",
      }),
      makeGame({
        id: "g4",
        round: "round_of_64",
        status: "final",
        winnerTeamId: "G",
        team1Id: "G",
        team2Id: "H",
      }),
      makeGame({
        id: "g5",
        round: "round_of_32",
        status: "final",
        winnerTeamId: "A",
        team1Id: "A",
        team2Id: "C",
      }),
      makeGame({
        id: "g6",
        round: "round_of_32",
        status: "scheduled",
        team1Id: "F",
        team2Id: "G",
      }),
    ];

    const allPicks = {
      // Perfect so far: 4 R64 correct + R32 correct = 4 + 2 = 6
      Perfect: [
        { tournamentGameId: "g1", pickedTeamId: "A" },
        { tournamentGameId: "g2", pickedTeamId: "C" },
        { tournamentGameId: "g3", pickedTeamId: "F" },
        { tournamentGameId: "g4", pickedTeamId: "G" },
        { tournamentGameId: "g5", pickedTeamId: "A" },
        { tournamentGameId: "g6", pickedTeamId: "F" }, // alive
      ],
      // 3 R64 correct + R32 correct = 3 + 2 = 5
      AlmostPerfect: [
        { tournamentGameId: "g1", pickedTeamId: "A" },
        { tournamentGameId: "g2", pickedTeamId: "D" }, // wrong
        { tournamentGameId: "g3", pickedTeamId: "F" },
        { tournamentGameId: "g4", pickedTeamId: "G" },
        { tournamentGameId: "g5", pickedTeamId: "A" },
        { tournamentGameId: "g6", pickedTeamId: "G" }, // alive
      ],
      // Same as AlmostPerfect but different R32 pending pick
      TiedWithAlmost: [
        { tournamentGameId: "g1", pickedTeamId: "A" },
        { tournamentGameId: "g2", pickedTeamId: "D" }, // wrong
        { tournamentGameId: "g3", pickedTeamId: "F" },
        { tournamentGameId: "g4", pickedTeamId: "G" },
        { tournamentGameId: "g5", pickedTeamId: "A" },
        { tournamentGameId: "g6", pickedTeamId: "F" }, // alive
      ],
      // 2 R64 correct, R32 wrong = 2 + 0 = 2
      Mediocre: [
        { tournamentGameId: "g1", pickedTeamId: "A" },
        { tournamentGameId: "g2", pickedTeamId: "D" }, // wrong
        { tournamentGameId: "g3", pickedTeamId: "E" }, // wrong
        { tournamentGameId: "g4", pickedTeamId: "G" },
        { tournamentGameId: "g5", pickedTeamId: "D" }, // eliminated
        { tournamentGameId: "g6", pickedTeamId: "E" }, // eliminated
      ],
      // 0 correct
      Busted: [
        { tournamentGameId: "g1", pickedTeamId: "B" },
        { tournamentGameId: "g2", pickedTeamId: "D" },
        { tournamentGameId: "g3", pickedTeamId: "E" },
        { tournamentGameId: "g4", pickedTeamId: "H" },
        { tournamentGameId: "g5", pickedTeamId: "B" }, // eliminated
        { tournamentGameId: "g6", pickedTeamId: "E" }, // eliminated
      ],
    };

    const scores = Object.entries(allPicks).map(([name, picks]) => ({
      name,
      ...calculateBracketScores(games, picks, DEFAULT_SCORING),
      tiebreakerDiff: null,
    }));

    const standings = sortAndRankStandings(scores);

    // Perfect: 6pts, potential 6+2=8
    // AlmostPerfect: 5pts, potential 5+2=7
    // TiedWithAlmost: 5pts, potential 5+2=7
    // Mediocre: 2pts, potential 2
    // Busted: 0pts, potential 0
    expect(standings.map((s) => s.name)).toEqual([
      "Perfect",
      "AlmostPerfect",
      "TiedWithAlmost",
      "Mediocre",
      "Busted",
    ]);

    // AlmostPerfect and TiedWithAlmost are tied on points and potential
    expect(standings[1].rank).toBe(2);
    expect(standings[2].rank).toBe(2); // same rank (tied)
    expect(standings[3].rank).toBe(4); // skips to 4
    expect(standings[4].rank).toBe(5);
  });
});

describe("getEliminationStatus", () => {
  it("returns empty map for no entries", () => {
    const result = getEliminationStatus([]);
    expect(result.size).toBe(0);
  });

  it("single entry is never eliminated", () => {
    const result = getEliminationStatus([
      { totalPoints: 10, potentialPoints: 20 },
    ]);
    expect(result.get(0)).toBe(false);
  });

  it("leader is never eliminated", () => {
    const entries = [
      { totalPoints: 30, potentialPoints: 50 },
      { totalPoints: 10, potentialPoints: 40 },
    ];
    const result = getEliminationStatus(entries);
    expect(result.get(0)).toBe(false);
  });

  it("eliminates entry whose potentialPoints < leader totalPoints", () => {
    const entries = [
      { totalPoints: 30, potentialPoints: 50 },
      { totalPoints: 10, potentialPoints: 25 },
    ];
    const result = getEliminationStatus(entries);
    expect(result.get(0)).toBe(false);
    expect(result.get(1)).toBe(true);
  });

  it("does NOT eliminate when potentialPoints === leader totalPoints", () => {
    const entries = [
      { totalPoints: 30, potentialPoints: 50 },
      { totalPoints: 10, potentialPoints: 30 },
    ];
    const result = getEliminationStatus(entries);
    expect(result.get(1)).toBe(false);
  });

  it("top 2 contention: not eliminated if fewer than 2 entries beat it", () => {
    const entries = [
      { totalPoints: 40, potentialPoints: 50 },
      { totalPoints: 30, potentialPoints: 45 },
      { totalPoints: 10, potentialPoints: 35 },
    ];
    const result = getEliminationStatus(entries, 2);
    // Entry 2: only entry 0 has totalPoints (40) > potentialPoints (35) — 1 < 2, not eliminated
    expect(result.get(2)).toBe(false);
  });

  it("top 2 contention: eliminated when 2+ entries beat it", () => {
    const entries = [
      { totalPoints: 40, potentialPoints: 50 },
      { totalPoints: 35, potentialPoints: 45 },
      { totalPoints: 10, potentialPoints: 30 },
    ];
    const result = getEliminationStatus(entries, 2);
    // Entry 2: entries 0 (40) and 1 (35) both > 30 — 2 >= 2, eliminated
    expect(result.get(2)).toBe(true);
  });

  it("top 3 contention", () => {
    const entries = [
      { totalPoints: 50, potentialPoints: 60 },
      { totalPoints: 40, potentialPoints: 55 },
      { totalPoints: 35, potentialPoints: 50 },
      { totalPoints: 10, potentialPoints: 30 },
    ];
    const result = getEliminationStatus(entries, 3);
    // Entry 3: 3 entries have totalPoints > 30 — eliminated
    expect(result.get(3)).toBe(true);
    // Entry 2: only 2 entries have totalPoints > 50 (none do) — not eliminated
    expect(result.get(2)).toBe(false);
  });

  it("all entries tied: none eliminated", () => {
    const entries = [
      { totalPoints: 20, potentialPoints: 40 },
      { totalPoints: 20, potentialPoints: 40 },
      { totalPoints: 20, potentialPoints: 40 },
    ];
    const result = getEliminationStatus(entries);
    expect(result.get(0)).toBe(false);
    expect(result.get(1)).toBe(false);
    expect(result.get(2)).toBe(false);
  });

  it("pre-tournament: all equal potential, none eliminated", () => {
    const entries = [
      { totalPoints: 0, potentialPoints: 63 },
      { totalPoints: 0, potentialPoints: 63 },
      { totalPoints: 0, potentialPoints: 63 },
    ];
    const result = getEliminationStatus(entries);
    expect(result.get(0)).toBe(false);
    expect(result.get(1)).toBe(false);
    expect(result.get(2)).toBe(false);
  });
});

describe("isFinalFourMode", () => {
  it("returns false when no elite 8 games exist", () => {
    expect(isFinalFourMode([])).toBe(false);
  });

  it("returns false when elite 8 games are not all final", () => {
    const games = [
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "scheduled" },
      { round: "elite_8", status: "final" },
      { round: "final_four", status: "scheduled" },
    ];
    expect(isFinalFourMode(games)).toBe(false);
  });

  it("returns true when all elite 8 final and F4 games pending", () => {
    const games = [
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "final_four", status: "scheduled" },
      { round: "final_four", status: "scheduled" },
      { round: "championship", status: "scheduled" },
    ];
    expect(isFinalFourMode(games)).toBe(true);
  });

  it("returns true when F4 done but championship pending", () => {
    const games = [
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "final_four", status: "final" },
      { round: "final_four", status: "final" },
      { round: "championship", status: "scheduled" },
    ];
    expect(isFinalFourMode(games)).toBe(true);
  });

  it("returns false when all games are final (tournament over)", () => {
    const games = [
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "elite_8", status: "final" },
      { round: "final_four", status: "final" },
      { round: "final_four", status: "final" },
      { round: "championship", status: "final" },
    ];
    expect(isFinalFourMode(games)).toBe(false);
  });
});

describe("generateScenarios", () => {
  it("returns empty for no remaining games", () => {
    expect(generateScenarios([])).toEqual([]);
  });

  it("generates 2 scenarios for championship only", () => {
    const games = [
      {
        id: "champ",
        round: "championship",
        team1Id: "A",
        team2Id: "B",
        team1SourceGameId: null,
        team2SourceGameId: null,
      },
    ];
    const scenarios = generateScenarios(games);
    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].get("champ")).toBe("A");
    expect(scenarios[1].get("champ")).toBe("B");
  });

  it("generates 8 scenarios for full final four", () => {
    const games = [
      {
        id: "f4-1",
        round: "final_four",
        team1Id: "A",
        team2Id: "B",
        team1SourceGameId: null,
        team2SourceGameId: null,
      },
      {
        id: "f4-2",
        round: "final_four",
        team1Id: "C",
        team2Id: "D",
        team1SourceGameId: null,
        team2SourceGameId: null,
      },
      {
        id: "champ",
        round: "championship",
        team1Id: null,
        team2Id: null,
        team1SourceGameId: "f4-1",
        team2SourceGameId: "f4-2",
      },
    ];
    const scenarios = generateScenarios(games);
    expect(scenarios).toHaveLength(8);

    // Verify all unique combinations
    const combos = scenarios.map(
      (s) => `${s.get("f4-1")}-${s.get("f4-2")}-${s.get("champ")}`,
    );
    expect(new Set(combos).size).toBe(8);

    // Championship teams should come from F4 winners
    for (const s of scenarios) {
      const champWinner = s.get("champ")!;
      const f4_1_winner = s.get("f4-1")!;
      const f4_2_winner = s.get("f4-2")!;
      expect([f4_1_winner, f4_2_winner]).toContain(champWinner);
    }
  });

  it("generates 4 scenarios when one F4 game is already decided", () => {
    // Only F4-2 and championship remaining
    const games = [
      {
        id: "f4-2",
        round: "final_four",
        team1Id: "C",
        team2Id: "D",
        team1SourceGameId: null,
        team2SourceGameId: null,
      },
      {
        id: "champ",
        round: "championship",
        team1Id: "A", // F4-1 winner already known
        team2Id: null,
        team1SourceGameId: null,
        team2SourceGameId: "f4-2",
      },
    ];
    const scenarios = generateScenarios(games);
    expect(scenarios).toHaveLength(4);

    // Championship should always have A as one participant
    for (const s of scenarios) {
      const champWinner = s.get("champ")!;
      const f4_2_winner = s.get("f4-2")!;
      expect(["A", f4_2_winner]).toContain(champWinner);
    }
  });
});

describe("getScenarioEliminationStatus", () => {
  // Helper to create entries for scenario tests
  function makeScenarioEntry(
    id: string,
    totalPoints: number,
    potentialPoints: number,
  ) {
    return {
      id,
      totalPoints,
      potentialPoints,
      name: id,
      tiebreakerDiff: null,
    };
  }

  it("correlated picks: entry eliminated despite high potential (simple check would say alive)", () => {
    // Scenario: championship game remaining. A is at 80, B is at 70.
    // Both picked team X to win championship (32 pts).
    // Simple check: B potential = 70+32 = 102 > A total 80 → "Alive"
    // Scenario check: if X wins, A=112, B=102 → B still behind
    //                 if Y wins, A=80, B=70 → B still behind
    // B is eliminated in ALL scenarios.
    const entries = [
      makeScenarioEntry("A", 80, 112),
      makeScenarioEntry("B", 70, 102),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        A: { champ: "teamX" },
        B: { champ: "teamX" },
      },
    };

    // Simple check says alive (B potential 102 > A total 80)
    const simpleResult = getEliminationStatus(entries, 1);
    expect(simpleResult.get(1)).toBe(false); // simple says alive

    // Scenario check correctly says eliminated
    const scenarioResult = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      1,
    );
    expect(scenarioResult.get(0)).toBe(false); // A alive
    expect(scenarioResult.get(1)).toBe(true); // B eliminated
  });

  it("different picks: entry alive when they have a winning scenario", () => {
    // A at 80, B at 70. A picked teamX, B picked teamY for championship.
    // If teamY wins: A=80, B=102 → B wins. B has a winning scenario.
    const entries = [
      makeScenarioEntry("A", 80, 112),
      makeScenarioEntry("B", 70, 102),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        A: { champ: "teamX" },
        B: { champ: "teamY" },
      },
    };

    const result = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      1,
    );
    expect(result.get(0)).toBe(false); // A alive (wins if teamX wins)
    expect(result.get(1)).toBe(false); // B alive (wins if teamY wins)
  });

  it("full final four: correlated picks eliminate entry across all 8 scenarios", () => {
    // A at 100, B at 90. Both have identical F4 and championship picks.
    // B can never close the 10-point gap because every point B gets, A gets too.
    const entries = [
      makeScenarioEntry("A", 100, 148), // 100 + 16 + 16 + 32 = 164 potential
      makeScenarioEntry("B", 90, 138),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "f4-1",
          round: "final_four",
          team1Id: "t1",
          team2Id: "t2",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
        {
          id: "f4-2",
          round: "final_four",
          team1Id: "t3",
          team2Id: "t4",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
        {
          id: "champ",
          round: "championship",
          team1Id: null,
          team2Id: null,
          team1SourceGameId: "f4-1",
          team2SourceGameId: "f4-2",
        },
      ],
      entryPicks: {
        // Both pick exactly the same
        A: { "f4-1": "t1", "f4-2": "t3", champ: "t1" },
        B: { "f4-1": "t1", "f4-2": "t3", champ: "t1" },
      },
    };

    const result = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      1,
    );
    expect(result.get(0)).toBe(false); // A always ahead
    expect(result.get(1)).toBe(true); // B always behind
  });

  it("top 2 contention: entry alive if they can finish in top 2 in any scenario", () => {
    // A=100, B=95, C=80. Championship remaining.
    // A picked teamX, B picked teamX, C picked teamY.
    // If teamY wins: A=100, B=95, C=112 → C is 1st, so top 2 = C, A. B is 3rd.
    // If teamX wins: A=132, B=127, C=80 → top 2 = A, B. C is 3rd.
    // C finishes top 2 in one scenario → alive for top 2.
    const entries = [
      makeScenarioEntry("A", 100, 132),
      makeScenarioEntry("B", 95, 127),
      makeScenarioEntry("C", 80, 112),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        A: { champ: "teamX" },
        B: { champ: "teamX" },
        C: { champ: "teamY" },
      },
    };

    const result = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      2,
    );
    expect(result.get(0)).toBe(false); // A top 2 in both
    expect(result.get(1)).toBe(false); // B top 2 when teamX wins
    expect(result.get(2)).toBe(false); // C top 2 when teamY wins
  });

  it("ties are treated conservatively (entry not eliminated if tied)", () => {
    // A=80, B=80. Both picked same team. Tied in every scenario.
    // Neither should be eliminated since tiebreaker is unknown.
    const entries = [
      makeScenarioEntry("A", 80, 112),
      makeScenarioEntry("B", 80, 112),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        A: { champ: "teamX" },
        B: { champ: "teamX" },
      },
    };

    const result = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      1,
    );
    expect(result.get(0)).toBe(false);
    expect(result.get(1)).toBe(false);
  });

  it("entry with no picks for remaining games still scored correctly", () => {
    // A=80 with championship pick, B=70 with no picks for remaining games.
    // B's max is always 70. If teamX wins, A=112 > 70. If teamY wins, A=80 > 70.
    const entries = [
      makeScenarioEntry("A", 80, 112),
      makeScenarioEntry("B", 70, 70),
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        A: { champ: "teamX" },
        // B has no picks for remaining games
      },
    };

    const result = getScenarioEliminationStatus(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      1,
    );
    expect(result.get(0)).toBe(false);
    expect(result.get(1)).toBe(true);
  });
});

describe("buildScenarioResults", () => {
  const teamNames: Record<string, string> = {
    teamA: "Duke",
    teamB: "Houston",
    teamC: "UConn",
    teamD: "Auburn",
  };

  it("builds correct number of scenario results for championship only", () => {
    const entries = [
      { id: "e1", name: "Entry 1", totalPoints: 50 },
      { id: "e2", name: "Entry 2", totalPoints: 40 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamA",
          team2Id: "teamB",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamA" },
        e2: { champ: "teamB" },
      },
    };

    const results = buildScenarioResults(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      teamNames,
    );
    expect(results).toHaveLength(2);
    expect(results[0].label).toContain("Duke");
    expect(results[0].label).toContain("Houston");
    expect(results[0].standings).toHaveLength(2);
  });

  it("generates descriptive labels with team names", () => {
    const entries = [{ id: "e1", name: "Entry 1", totalPoints: 50 }];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "f4-1",
          round: "final_four",
          team1Id: "teamA",
          team2Id: "teamB",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
        {
          id: "champ",
          round: "championship",
          team1Id: null,
          team2Id: "teamC",
          team1SourceGameId: "f4-1",
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { "f4-1": "teamA", champ: "teamA" },
      },
    };

    const results = buildScenarioResults(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      teamNames,
    );
    // Should have labels with "over" for F4 and "wins championship over" for champ
    expect(results.some((r) => r.label.includes("over"))).toBe(true);
  });

  it("projects standings correctly — correct picks get points", () => {
    const entries = [
      { id: "e1", name: "Entry 1", totalPoints: 50 },
      { id: "e2", name: "Entry 2", totalPoints: 40 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamA",
          team2Id: "teamB",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamA" },
        e2: { champ: "teamB" },
      },
    };

    const results = buildScenarioResults(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      teamNames,
    );

    // Scenario where teamA wins: e1 gets 32 championship pts
    const teamAWins = results.find((r) => r.scenario.get("champ") === "teamA")!;
    const e1Standing = teamAWins.standings.find((s) => s.id === "e1")!;
    const e2Standing = teamAWins.standings.find((s) => s.id === "e2")!;
    expect(e1Standing.projectedPoints).toBe(82); // 50 + 32
    expect(e2Standing.projectedPoints).toBe(40); // no points
    expect(e1Standing.rank).toBe(1);
    expect(e2Standing.rank).toBe(2);
  });

  it("marks tied entries correctly", () => {
    const entries = [
      { id: "e1", name: "Entry 1", totalPoints: 50 },
      { id: "e2", name: "Entry 2", totalPoints: 50 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamA",
          team2Id: "teamB",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamA" },
        e2: { champ: "teamA" },
      },
    };

    const results = buildScenarioResults(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      teamNames,
    );
    // When teamA wins, both get 82 pts — tied
    const teamAWins = results.find((r) => r.scenario.get("champ") === "teamA")!;
    expect(teamAWins.standings[0].rank).toBe(1);
    expect(teamAWins.standings[1].rank).toBe(1);
    // Both entries in the tie group should be marked
    expect(teamAWins.standings[0].tiedOnPoints).toBe(true);
    expect(teamAWins.standings[1].tiedOnPoints).toBe(true);
  });
});

describe("computeScenarioSummaries", () => {
  const teamNames: Record<string, string> = {
    teamX: "Duke",
    teamY: "Houston",
  };

  function makeResults(
    entries: { id: string; name: string; totalPoints: number }[],
    scenarioData: ScenarioData,
  ) {
    return buildScenarioResults(
      entries,
      scenarioData,
      DEFAULT_SCORING,
      teamNames,
    );
  }

  it("computes best/worst finish across scenarios", () => {
    const entries = [
      { id: "e1", name: "Alpha", totalPoints: 50 },
      { id: "e2", name: "Bravo", totalPoints: 40 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamX" },
        e2: { champ: "teamY" },
      },
    };

    const results = makeResults(entries, scenarioData);
    const summaries = computeScenarioSummaries(
      results,
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        currentPoints: e.totalPoints,
      })),
      1,
    );

    // e1: wins when teamX wins (82 vs 40), loses when teamY wins (50 vs 72)
    const e1 = summaries.find((s) => s.id === "e1")!;
    expect(e1.bestFinish).toBe(1);
    expect(e1.worstFinish).toBe(2);
    expect(e1.scenariosInTopN).toBe(1);
    expect(e1.totalScenarios).toBe(2);

    // e2: wins when teamY wins, loses when teamX wins
    const e2 = summaries.find((s) => s.id === "e2")!;
    expect(e2.bestFinish).toBe(1);
    expect(e2.worstFinish).toBe(2);
    expect(e2.scenariosInTopN).toBe(1);
  });

  it("adapts to topN contention level", () => {
    const entries = [
      { id: "e1", name: "A", totalPoints: 80 },
      { id: "e2", name: "B", totalPoints: 70 },
      { id: "e3", name: "C", totalPoints: 60 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamX" },
        e2: { champ: "teamX" },
        e3: { champ: "teamY" },
      },
    };

    const results = makeResults(entries, scenarioData);

    // topN=1: only the entry in 1st counts
    const top1 = computeScenarioSummaries(
      results,
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        currentPoints: e.totalPoints,
      })),
      1,
    );
    const e3Top1 = top1.find((s) => s.id === "e3")!;

    // topN=2: e3 can finish top 2 when teamY wins (60+32=92 vs e1=80, e2=70)
    const top2 = computeScenarioSummaries(
      results,
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        currentPoints: e.totalPoints,
      })),
      2,
    );
    const e3Top2 = top2.find((s) => s.id === "e3")!;
    expect(e3Top2.scenariosInTopN).toBeGreaterThanOrEqual(
      e3Top1.scenariosInTopN,
    );
  });

  it("handles ties: tied entries both count as achieving that rank", () => {
    const entries = [
      { id: "e1", name: "A", totalPoints: 50 },
      { id: "e2", name: "B", totalPoints: 50 },
    ];
    const scenarioData: ScenarioData = {
      remainingGames: [
        {
          id: "champ",
          round: "championship",
          team1Id: "teamX",
          team2Id: "teamY",
          team1SourceGameId: null,
          team2SourceGameId: null,
        },
      ],
      entryPicks: {
        e1: { champ: "teamX" },
        e2: { champ: "teamX" },
      },
    };

    const results = makeResults(entries, scenarioData);
    const summaries = computeScenarioSummaries(
      results,
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        currentPoints: e.totalPoints,
      })),
      1,
    );

    // When teamX wins: both at 82, tied at rank 1
    // When teamY wins: both at 50, tied at rank 1
    // Both should count as finishing 1st in all scenarios
    expect(summaries[0].scenariosInTopN).toBe(2);
    expect(summaries[1].scenariosInTopN).toBe(2);
    expect(summaries[0].bestFinish).toBe(1);
    expect(summaries[1].bestFinish).toBe(1);
  });

  it("returns empty for no scenario results", () => {
    const summaries = computeScenarioSummaries([], [], 1);
    expect(summaries).toEqual([]);
  });
});
