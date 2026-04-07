"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EliminationBadge } from "@/components/pool/elimination-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TeamLogo } from "@/components/team-logo";
import { formatOrdinal } from "@/lib/utils";
import {
  deleteBracketEntryAction,
  duplicateBracketEntryAction,
} from "./actions";

interface BracketEntryRowProps {
  entry: {
    id: string;
    name: string;
    status: string;
  };
  poolId: string;
  tournamentStarted: boolean;
  tournamentComplete?: boolean;
  canDuplicate: boolean;
  championPick: {
    teamShortName: string;
    teamMascot: string | null;
    teamLogoUrl: string | null;
    teamDarkLogoUrl: string | null;
  } | null;
  isChampionEliminated?: boolean;
  isEliminated?: boolean | null;
  standingsInfo?: {
    rank: number;
    totalPoints: number;
    potentialPoints: number;
  } | null;
  totalBrackets?: number;
}

export function BracketEntryRow({
  entry,
  poolId,
  tournamentStarted,
  tournamentComplete = false,
  canDuplicate,
  championPick,
  isChampionEliminated = false,
  isEliminated,
  standingsInfo,
  totalBrackets,
}: BracketEntryRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isDraft = entry.status !== "submitted" && !tournamentStarted;

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateBracketEntryAction(poolId, entry.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket duplicated");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBracketEntryAction(entry.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket deleted");
        router.refresh();
      }
    });
  }

  const championAlt = championPick
    ? championPick.teamMascot
      ? `${championPick.teamShortName} ${championPick.teamMascot}`
      : championPick.teamShortName
    : "";

  return (
    <>
      <Link
        href={`/pools/${poolId}/brackets/${entry.id}`}
        className={`flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted ${
          isDraft ? "border-warning bg-warning/10" : ""
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {isDraft && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
            )}
            {championPick && (
              <span className="relative shrink-0">
                <TeamLogo
                  logoUrl={championPick.teamLogoUrl}
                  darkLogoUrl={championPick.teamDarkLogoUrl}
                  alt={championAlt}
                  className={`h-6 w-6 object-contain ${isChampionEliminated ? "opacity-40 grayscale" : ""}`}
                />
                {isChampionEliminated && (
                  <X
                    className="absolute -inset-0.5 h-7 w-7 text-destructive"
                    strokeWidth={3}
                  />
                )}
              </span>
            )}
            {isEliminated !== null && isEliminated !== undefined && (
              <span className="shrink-0">
                <EliminationBadge isEliminated={isEliminated} />
              </span>
            )}
            <span className="truncate font-medium">{entry.name}</span>
          </div>
          {tournamentStarted && standingsInfo && (
            <div className="flex items-center gap-3 text-sm sm:ml-auto">
              <span className="font-medium text-muted-foreground">
                {formatOrdinal(standingsInfo.rank)} of {totalBrackets}
              </span>
              <span>
                <span className="font-semibold">
                  {standingsInfo.totalPoints}
                </span>
                <span className="text-muted-foreground"> pts</span>
              </span>
              {!tournamentComplete && (
                <span className="text-muted-foreground">
                  {standingsInfo.potentialPoints} potential
                </span>
              )}
            </div>
          )}
          {!tournamentStarted && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <Badge
                variant={entry.status === "submitted" ? "default" : "outline"}
                className={
                  entry.status === "submitted"
                    ? ""
                    : "border-warning bg-warning/10 text-warning-foreground"
                }
              >
                {entry.status === "submitted" ? "Submitted" : "Not Submitted"}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!tournamentStarted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicate();
                  }}
                  disabled={!canDuplicate || isPending}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bracket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{entry.name}&quot; and all its
              picks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
