"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, ArrowUpDown, Trophy, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserDisplay } from "@/components/user-display";
import { TeamLogo } from "@/components/team-logo";
import { EliminationBadge } from "@/components/pool/elimination-badge";
import { MovementIndicator } from "@/components/pool/movement-indicator";
import {
  getEliminationStatus,
  getScenarioEliminationStatus,
  type ScenarioData,
  type PoolScoring,
} from "@/lib/scoring";

interface StandingsEntry {
  id: string;
  name: string;
  totalPoints: number;
  potentialPoints: number;
  tiebreakerDiff: number | null;
  userId: string;
  userName: string;
  userImage: string | null;
  userUsername: string | null;
  rank: number;
  championPick: {
    teamShortName: string;
    teamMascot: string | null;
    teamLogoUrl: string | null;
    teamDarkLogoUrl: string | null;
  } | null;
  isChampionEliminated: boolean;
}

type SortField = "rank" | "points" | "potential";

interface MovementData {
  previousRank: number | null;
  isNew: boolean;
}

interface StandingsTableProps {
  standings: StandingsEntry[];
  poolId: string;
  tournamentStarted?: boolean;
  movement?: Record<string, MovementData>;
  currentUserId?: string;
  scenarioData?: ScenarioData | null;
  poolScoring?: PoolScoring;
  topN?: 1 | 2 | 3;
  onTopNChange?: (n: 1 | 2 | 3) => void;
}

export function StandingsTable({
  standings,
  poolId,
  tournamentStarted = false,
  movement,
  currentUserId,
  scenarioData,
  poolScoring,
  topN: externalTopN,
  onTopNChange,
}: StandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [internalTopN, setInternalTopN] = useState<1 | 2 | 3>(1);
  const topN = externalTopN ?? internalTopN;
  const setTopN = onTopNChange ?? setInternalTopN;

  const sorted = useMemo(() => {
    if (sortField === "rank") return standings;
    return [...standings].sort((a, b) => {
      if (sortField === "points") return b.totalPoints - a.totalPoints;
      return b.potentialPoints - a.potentialPoints;
    });
  }, [standings, sortField]);

  const eliminationMap = useMemo(() => {
    if (!tournamentStarted) return null;
    if (scenarioData && poolScoring) {
      return getScenarioEliminationStatus(
        sorted,
        scenarioData,
        poolScoring,
        topN,
      );
    }
    return getEliminationStatus(sorted, topN);
  }, [sorted, topN, tournamentStarted, scenarioData, poolScoring]);

  function handleSort(field: SortField) {
    setSortField((prev) => (prev === field ? "rank" : field));
  }

  if (standings.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No brackets have been created yet.
      </p>
    );
  }

  return (
    <>
      {/* Contention toggle */}
      {tournamentStarted && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Contention:</span>
          <div className="inline-flex rounded-md border border-border">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTopN(n)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  topN === n
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {n === 1 ? "1st" : `Top ${n}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {movement && (
                <TableHead className="w-12 text-center">+/-</TableHead>
              )}
              <TableHead>Bracket</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-16 text-center">Champ</TableHead>
              <TableHead className="w-20 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("points")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Pts
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-24 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("potential")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Potential
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              {tournamentStarted && (
                <TableHead className="w-28 text-center">Status</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((entry, i) => {
              const isEliminated = eliminationMap?.get(i) ?? false;
              const isCurrentUser = currentUserId === entry.userId;
              return (
                <TableRow
                  key={entry.id}
                  className={`${isEliminated ? "opacity-60" : ""} ${isCurrentUser ? "bg-primary/5" : ""}`}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {entry.rank}
                  </TableCell>
                  {movement && (
                    <TableCell className="text-center">
                      {movement[entry.id] ? (
                        <MovementIndicator
                          previousRank={movement[entry.id].previousRank}
                          currentRank={entry.rank}
                          isNew={movement[entry.id].isNew}
                        />
                      ) : null}
                    </TableCell>
                  )}
                  <TableCell>
                    <Link
                      href={`/pools/${poolId}/brackets/${entry.id}`}
                      className="font-medium underline decoration-muted-foreground decoration-1 underline-offset-2 hover:decoration-foreground"
                    >
                      {entry.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <UserDisplay
                      name={entry.userName}
                      image={entry.userImage}
                      username={entry.userUsername}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <ChampionDisplay
                      championPick={entry.championPick}
                      isEliminated={entry.isChampionEliminated}
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {entry.totalPoints}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.potentialPoints}
                  </TableCell>
                  {tournamentStarted && (
                    <TableCell className="text-center">
                      <EliminationBadge isEliminated={isEliminated} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile list */}
      <div className="space-y-1 md:hidden">
        {sorted.map((entry, i) => {
          const isEliminated = eliminationMap?.get(i) ?? false;
          const isCurrentUser = currentUserId === entry.userId;
          return (
            <Link
              key={entry.id}
              href={`/pools/${poolId}/brackets/${entry.id}`}
              className={`flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors active:bg-muted ${
                isEliminated ? "opacity-60" : ""
              } ${isCurrentUser ? "bg-primary/5" : ""}`}
            >
              <div className="flex w-10 shrink-0 flex-col items-center">
                <span className="text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
                {movement && movement[entry.id] && (
                  <MovementIndicator
                    previousRank={movement[entry.id].previousRank}
                    currentRank={entry.rank}
                    isNew={movement[entry.id].isNew}
                  />
                )}
              </div>
              <ChampionDisplay
                championPick={entry.championPick}
                isEliminated={entry.isChampionEliminated}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{entry.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {entry.userName}
                  </span>
                  {tournamentStarted && (
                    <EliminationBadge isEliminated={isEliminated} />
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">{entry.totalPoints}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.potentialPoints}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ChampionDisplay({
  championPick,
  isEliminated,
}: {
  championPick: StandingsEntry["championPick"];
  isEliminated: boolean;
}) {
  if (!championPick) {
    return <span className="text-xs text-muted-foreground">&mdash;</span>;
  }
  const displayName = championPick.teamMascot
    ? `${championPick.teamShortName} ${championPick.teamMascot}`
    : championPick.teamShortName;
  if (championPick.teamLogoUrl) {
    return (
      <span className="relative inline-flex">
        <TeamLogo
          logoUrl={championPick.teamLogoUrl}
          darkLogoUrl={championPick.teamDarkLogoUrl}
          alt={displayName}
          className={`h-6 w-6 object-contain ${isEliminated ? "opacity-40 grayscale" : ""}`}
        />
        {isEliminated && (
          <X
            className="absolute -inset-0.5 h-7 w-7 text-destructive"
            strokeWidth={3}
          />
        )}
      </span>
    );
  }
  return <Trophy className="h-4 w-4 text-muted-foreground" />;
}
