"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamLogo } from "@/components/team-logo";
import {
  buildScenarioResults,
  computeScenarioSummaries,
  type ScenarioData,
  type ScenarioResult,
  type ScenarioSummary,
  type PoolScoring,
} from "@/lib/scoring";

interface TeamMapEntry {
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
}

interface StandingsEntryInput {
  id: string;
  name: string;
  totalPoints: number;
  userId: string;
}

interface ScenarioSimulatorCardProps {
  standings: StandingsEntryInput[];
  scenarioData: ScenarioData;
  poolScoring: PoolScoring;
  topN: 1 | 2 | 3;
  teamMap: Record<string, TeamMapEntry>;
  poolId: string;
  currentUserId?: string;
}

const DEFAULT_VISIBLE = 10;

export function ScenarioSimulatorCard({
  standings,
  scenarioData,
  poolScoring,
  topN,
  teamMap,
  poolId,
  currentUserId,
}: ScenarioSimulatorCardProps) {
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Build entry ID → userId lookup for highlighting current user
  const userByEntryId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of standings) {
      map[s.id] = s.userId;
    }
    return map;
  }, [standings]);

  // Build team name lookup for scenario labels
  const teamNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const [id, team] of Object.entries(teamMap)) {
      names[id] = team.shortName;
    }
    return names;
  }, [teamMap]);

  const scenarioResults = useMemo(
    () => buildScenarioResults(standings, scenarioData, poolScoring, teamNames),
    [standings, scenarioData, poolScoring, teamNames],
  );

  const summaries = useMemo(
    () =>
      computeScenarioSummaries(
        scenarioResults,
        standings.map((s) => ({
          id: s.id,
          name: s.name,
          currentPoints: s.totalPoints,
        })),
        topN,
      ),
    [scenarioResults, standings, topN],
  );

  // Sort summaries: best finish asc, then most scenarios in top N desc
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      if (a.bestFinish !== b.bestFinish) return a.bestFinish - b.bestFinish;
      if (b.scenariosInTopN !== a.scenariosInTopN)
        return b.scenariosInTopN - a.scenariosInTopN;
      return a.name.localeCompare(b.name);
    });
  }, [summaries]);

  const visibleSummaries = showAll
    ? sortedSummaries
    : sortedSummaries.slice(0, DEFAULT_VISIBLE);
  const hasMore = sortedSummaries.length > DEFAULT_VISIBLE;

  if (scenarioResults.length === 0) return null;

  const topNLabel = topN === 1 ? "1st" : `top ${topN}`;
  const totalScenarios = scenarioResults.length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Scenario Simulator
        </CardTitle>
        <CardDescription>
          {totalScenarios} possible outcome{totalScenarios !== 1 ? "s" : ""}{" "}
          remaining &mdash; showing chances of finishing {topNLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Table */}
        <SummaryTable
          summaries={visibleSummaries}
          topN={topN}
          totalScenarios={totalScenarios}
          poolId={poolId}
          currentUserId={currentUserId}
          userByEntryId={userByEntryId}
        />
        {hasMore && (
          <div className="mt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Show less"
                : `Show all ${sortedSummaries.length} entries`}
            </Button>
          </div>
        )}

        {/* Scenario Details */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold">Scenario Breakdown</h4>
          <div className="space-y-1">
            {scenarioResults.map((result, i) => (
              <ScenarioDetail
                key={i}
                index={i}
                result={result}
                expanded={expandedScenario === i}
                onToggle={() =>
                  setExpandedScenario(expandedScenario === i ? null : i)
                }
                teamMap={teamMap}
                poolId={poolId}
                scenarioData={scenarioData}
                currentUserId={currentUserId}
                userByEntryId={userByEntryId}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTable({
  summaries,
  topN,
  totalScenarios,
  poolId,
  currentUserId,
  userByEntryId,
}: {
  summaries: ScenarioSummary[];
  topN: number;
  totalScenarios: number;
  poolId: string;
  currentUserId?: string;
  userByEntryId: Record<string, string>;
}) {
  const topNLabel = topN === 1 ? "Wins" : `Top ${topN}`;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Bracket</th>
              <th className="pb-2 text-center font-medium">Best</th>
              <th className="pb-2 text-center font-medium">Worst</th>
              <th className="pb-2 text-center font-medium">{topNLabel}</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => {
              const isCurrentUser = currentUserId === userByEntryId[s.id];
              return (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 ${s.scenariosInTopN === 0 ? "opacity-50" : ""} ${isCurrentUser ? "bg-primary/5" : ""}`}
                >
                  <td className="py-1.5">
                    <Link
                      href={`/pools/${poolId}/brackets/${s.id}`}
                      className="font-medium underline decoration-muted-foreground decoration-1 underline-offset-2 hover:decoration-foreground"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-1.5 text-center">
                    <FinishBadge rank={s.bestFinish} />
                  </td>
                  <td className="py-1.5 text-center">
                    <FinishBadge rank={s.worstFinish} />
                  </td>
                  <td className="py-1.5 text-center">
                    <ScenarioCount
                      count={s.scenariosInTopN}
                      total={totalScenarios}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-1 md:hidden">
        {summaries.map((s) => {
          const isCurrentUser = currentUserId === userByEntryId[s.id];
          return (
            <Link
              key={s.id}
              href={`/pools/${poolId}/brackets/${s.id}`}
              className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors active:bg-muted ${s.scenariosInTopN === 0 ? "opacity-50" : ""} ${isCurrentUser ? "bg-primary/5" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Best: {ordinal(s.bestFinish)} &middot; Worst:{" "}
                    {ordinal(s.worstFinish)}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <ScenarioCount
                  count={s.scenariosInTopN}
                  total={totalScenarios}
                />
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ScenarioDetail({
  index,
  result,
  expanded,
  onToggle,
  teamMap,
  poolId,
  scenarioData,
  currentUserId,
  userByEntryId,
}: {
  index: number;
  result: ScenarioResult;
  expanded: boolean;
  onToggle: () => void;
  teamMap: Record<string, TeamMapEntry>;
  poolId: string;
  scenarioData: ScenarioData;
  currentUserId?: string;
  userByEntryId: Record<string, string>;
}) {
  // Build game matchup info for outcome badges
  const gameOutcomes = useMemo(() => {
    const f4Games = scenarioData.remainingGames.filter(
      (g) => g.round === "final_four",
    );
    const champGame = scenarioData.remainingGames.find(
      (g) => g.round === "championship",
    );

    const outcomes: {
      gameId: string;
      winnerId: string;
      loserId: string | null;
    }[] = [];

    for (const game of f4Games) {
      const winnerId = result.scenario.get(game.id);
      if (!winnerId) continue;
      const loserId = winnerId === game.team1Id ? game.team2Id : game.team1Id;
      outcomes.push({ gameId: game.id, winnerId, loserId });
    }

    if (champGame) {
      const winnerId = result.scenario.get(champGame.id);
      if (winnerId) {
        const champTeam1 = champGame.team1SourceGameId
          ? (result.scenario.get(champGame.team1SourceGameId) ??
            champGame.team1Id)
          : champGame.team1Id;
        const champTeam2 = champGame.team2SourceGameId
          ? (result.scenario.get(champGame.team2SourceGameId) ??
            champGame.team2Id)
          : champGame.team2Id;
        const loserId = winnerId === champTeam1 ? champTeam2 : champTeam1;
        outcomes.push({ gameId: champGame.id, winnerId, loserId });
      }
    }

    return outcomes;
  }, [result.scenario, scenarioData.remainingGames]);

  return (
    <div className="rounded-md border border-border/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium">Scenario {index + 1}</span>
        <span className="truncate text-muted-foreground">{result.label}</span>
      </button>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2">
          {/* Game outcomes with team logos */}
          <div className="mb-3 flex flex-wrap gap-2">
            {gameOutcomes.map(({ gameId, winnerId, loserId }) => {
              const winner = teamMap[winnerId];
              const loser = loserId ? teamMap[loserId] : null;
              if (!winner) return null;
              return (
                <Badge
                  key={gameId}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1"
                >
                  <TeamLogo
                    logoUrl={winner.logoUrl}
                    darkLogoUrl={winner.darkLogoUrl}
                    alt={winner.shortName}
                    className="h-4 w-4 object-contain"
                  />
                  <span className="text-xs font-medium">
                    {winner.shortName}
                  </span>
                  {loser && (
                    <>
                      <span className="text-[10px] text-muted-foreground">
                        over
                      </span>
                      <TeamLogo
                        logoUrl={loser.logoUrl}
                        darkLogoUrl={loser.darkLogoUrl}
                        alt={loser.shortName}
                        className="h-4 w-4 object-contain opacity-50"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {loser.shortName}
                      </span>
                    </>
                  )}
                </Badge>
              );
            })}
          </div>

          {/* Projected standings */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="w-8 pb-1 pr-2 font-medium">#</th>
                <th className="pb-1 pr-3 font-medium">Bracket</th>
                <th className="pb-1 pl-2 text-right font-medium">
                  Projected Pts
                </th>
                <th className="pb-1 pl-2 text-right font-medium">
                  Current Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {result.standings.map((standing) => {
                const isCurrentUser =
                  currentUserId === userByEntryId[standing.id];
                return (
                  <tr
                    key={standing.id}
                    className={`border-b border-border/30 ${isCurrentUser ? "bg-primary/5" : ""}`}
                  >
                    <td className="w-8 py-1.5 pr-2 text-muted-foreground">
                      {standing.rank}
                    </td>
                    <td className="py-1.5 pr-3">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
                        <Link
                          href={`/pools/${poolId}/brackets/${standing.id}`}
                          className="font-medium underline decoration-muted-foreground decoration-1 underline-offset-2 hover:decoration-foreground"
                        >
                          {standing.name}
                        </Link>
                        {standing.tiedOnPoints && (
                          <span className="text-[10px] leading-tight text-muted-foreground">
                            Tied on points &mdash; tiebreaker TBD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 pl-2 text-right font-semibold">
                      {standing.projectedPoints}
                    </td>
                    <td className="py-1.5 pl-2 text-right text-muted-foreground">
                      {standing.currentPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinishBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`text-xs font-medium ${rank === 1 ? "text-success" : "text-muted-foreground"}`}
    >
      {ordinal(rank)}
    </span>
  );
}

function ScenarioCount({ count, total }: { count: number; total: number }) {
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">0/{total}</span>;
  }
  if (count === total) {
    return (
      <Badge
        variant="outline"
        className="border-success/30 bg-success/10 text-[10px] text-success"
      >
        {count}/{total}
      </Badge>
    );
  }
  return (
    <span className="text-xs font-medium">
      {count}/{total}
    </span>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
