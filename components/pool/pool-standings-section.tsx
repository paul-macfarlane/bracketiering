"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StandingsTable } from "@/components/pool/standings-table";
import { ScenarioSimulatorCard } from "@/components/pool/scenario-simulator-card";
import { TournamentPodium } from "@/components/pool/tournament-podium";
import type { ScenarioData, PoolScoring } from "@/lib/scoring";

interface MovementData {
  previousRank: number | null;
  isNew: boolean;
}

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

interface TeamMapEntry {
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
}

interface PoolStandingsSectionProps {
  standings: StandingsEntry[];
  poolId: string;
  tournamentStarted: boolean;
  tournamentComplete?: boolean;
  movement?: Record<string, MovementData>;
  currentUserId: string;
  scenarioData: ScenarioData | null;
  poolScoring: PoolScoring;
  teamMap: Record<string, TeamMapEntry>;
}

export function PoolStandingsSection({
  standings,
  poolId,
  tournamentStarted,
  tournamentComplete = false,
  movement,
  currentUserId,
  scenarioData,
  poolScoring,
  teamMap,
}: PoolStandingsSectionProps) {
  const [topN, setTopN] = useState<1 | 2 | 3>(1);

  const topThree = tournamentComplete ? standings.slice(0, 3) : [];

  return (
    <>
      {tournamentComplete && topThree.length > 0 && (
        <TournamentPodium topThree={topThree} poolId={poolId} />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {tournamentComplete ? "Final Standings" : "Standings"}
          </CardTitle>
          <CardDescription>
            {standings.length} bracket{standings.length !== 1 ? "s" : ""} in
            this pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandingsTable
            standings={standings}
            poolId={poolId}
            tournamentStarted={tournamentStarted}
            tournamentComplete={tournamentComplete}
            movement={movement}
            currentUserId={currentUserId}
            scenarioData={scenarioData}
            poolScoring={poolScoring}
            topN={topN}
            onTopNChange={setTopN}
          />
        </CardContent>
      </Card>

      {!tournamentComplete && scenarioData && (
        <ScenarioSimulatorCard
          standings={standings}
          scenarioData={scenarioData}
          poolScoring={poolScoring}
          teamMap={teamMap}
          poolId={poolId}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
