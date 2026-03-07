"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateInviteDialog } from "./create-invite-dialog";
import { deleteInviteAction } from "./actions";

interface Invite {
  id: string;
  code: string;
  role: "leader" | "member";
  maxUses: number | null;
  useCount: number;
  expiresAt: Date;
  createdAt: Date;
  creatorName: string;
}

interface InviteListProps {
  poolId: string;
  invites: Invite[];
  remainingCapacity: number;
}

export function InviteList({
  poolId,
  invites,
  remainingCapacity,
}: InviteListProps) {
  const router = useRouter();

  async function handleDelete(inviteId: string) {
    const result = await deleteInviteAction(poolId, inviteId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Invite deleted");
    router.refresh();
  }

  function copyLink(code: string) {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  }

  function isExpired(invite: Invite) {
    return new Date(invite.expiresAt) < new Date();
  }

  function isMaxedOut(invite: Invite) {
    return invite.maxUses !== null && invite.useCount >= invite.maxUses;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invite Links</CardTitle>
            <CardDescription>
              Share links to invite others to this pool
            </CardDescription>
          </div>
          <CreateInviteDialog
            poolId={poolId}
            remainingCapacity={remainingCapacity}
            onInviteCreated={() => router.refresh()}
          />
        </div>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invite links yet. Create one to share with others.
          </p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const expired = isExpired(invite);
              const maxed = isMaxedOut(invite);
              const inactive = expired || maxed;

              return (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    inactive ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          invite.role === "leader" ? "default" : "secondary"
                        }
                      >
                        {invite.role}
                      </Badge>
                      {expired && <Badge variant="destructive">Expired</Badge>}
                      {maxed && !expired && (
                        <Badge variant="destructive">Max uses reached</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uses: {invite.useCount}
                      {invite.maxUses !== null ? ` / ${invite.maxUses}` : ""} |
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}{" "}
                      | Created by {invite.creatorName}
                    </p>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    {!inactive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(invite.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
