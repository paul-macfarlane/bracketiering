import Link from "next/link";
import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { UserDisplay } from "@/components/user-display";

interface PodiumEntry {
  id: string;
  name: string;
  totalPoints: number;
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
}

interface TournamentPodiumProps {
  topThree: PodiumEntry[];
  poolId: string;
}

const PLACE_CONFIG = [
  {
    label: "1st Place",
    color: "text-medal-gold",
    bgColor: "bg-medal-gold-bg border-medal-gold-border",
    iconSize: "h-8 w-8",
  },
  {
    label: "2nd Place",
    color: "text-medal-silver",
    bgColor: "bg-medal-silver-bg border-medal-silver-border",
    iconSize: "h-7 w-7",
  },
  {
    label: "3rd Place",
    color: "text-medal-bronze",
    bgColor: "bg-medal-bronze-bg border-medal-bronze-border",
    iconSize: "h-7 w-7",
  },
] as const;

export function TournamentPodium({ topThree, poolId }: TournamentPodiumProps) {
  if (topThree.length === 0) return null;

  // Podium order: 2nd | 1st (elevated) | 3rd
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Final Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop podium layout */}
        <div className="hidden items-end justify-center gap-3 md:flex">
          {podiumOrder.map((entry) => {
            const placeIndex = entry.rank - 1;
            const config = PLACE_CONFIG[placeIndex];
            if (!config) return null;
            const isFirst = entry.rank === 1;
            return (
              <div
                key={entry.id}
                className={`flex w-48 flex-col items-center rounded-lg border p-4 ${config.bgColor} ${isFirst ? "pb-6" : ""}`}
              >
                <Trophy className={`mb-2 ${config.iconSize} ${config.color}`} />
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}
                >
                  {config.label}
                </span>
                {entry.championPick?.teamLogoUrl && (
                  <TeamLogo
                    logoUrl={entry.championPick.teamLogoUrl}
                    darkLogoUrl={entry.championPick.teamDarkLogoUrl}
                    alt={
                      entry.championPick.teamMascot
                        ? `${entry.championPick.teamShortName} ${entry.championPick.teamMascot}`
                        : entry.championPick.teamShortName
                    }
                    className="mt-3 h-10 w-10 object-contain"
                  />
                )}
                <Link
                  href={`/pools/${poolId}/brackets/${entry.id}`}
                  className="mt-2 max-w-full truncate text-sm font-semibold underline decoration-muted-foreground decoration-1 underline-offset-2 hover:decoration-foreground"
                >
                  {entry.name}
                </Link>
                <div className="mt-1">
                  <UserDisplay
                    name={entry.userName}
                    image={entry.userImage}
                    username={entry.userUsername}
                    size="sm"
                  />
                </div>
                <div className="mt-2 text-lg font-bold">
                  {entry.totalPoints}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile stacked layout */}
        <div className="space-y-2 md:hidden">
          {topThree.map((entry) => {
            const placeIndex = entry.rank - 1;
            const config = PLACE_CONFIG[placeIndex];
            if (!config) return null;
            return (
              <Link
                key={entry.id}
                href={`/pools/${poolId}/brackets/${entry.id}`}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors active:bg-muted ${config.bgColor}`}
              >
                <Trophy className={`h-6 w-6 shrink-0 ${config.color}`} />
                {entry.championPick?.teamLogoUrl && (
                  <TeamLogo
                    logoUrl={entry.championPick.teamLogoUrl}
                    darkLogoUrl={entry.championPick.teamDarkLogoUrl}
                    alt={entry.championPick.teamShortName}
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {entry.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {entry.userName}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold">{entry.totalPoints}</div>
                  <span
                    className={`text-[10px] font-semibold uppercase ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
