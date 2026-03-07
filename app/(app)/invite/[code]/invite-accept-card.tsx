"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { acceptInviteAction } from "./actions";

interface InviteAcceptCardProps {
  code: string;
  poolName: string;
  poolImageUrl: string | null;
  role: "leader" | "member";
}

export function InviteAcceptCard({
  code,
  poolName,
  poolImageUrl,
  role,
}: InviteAcceptCardProps) {
  const [isJoining, setIsJoining] = useState(false);

  async function handleAccept() {
    setIsJoining(true);
    const result = await acceptInviteAction(code);

    if (result?.error) {
      toast.error(result.error);
      setIsJoining(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poolImageUrl || "/bracket.webp"}
        alt={poolName}
        className="h-32 w-full object-cover"
      />
      <CardHeader className="text-center">
        <CardTitle>You&apos;ve been invited!</CardTitle>
        <CardDescription>
          Join <span className="font-semibold">{poolName}</span> as a{" "}
          <Badge variant={role === "leader" ? "default" : "secondary"}>
            {role}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleAccept} disabled={isJoining}>
          {isJoining ? "Joining..." : "Join Pool"}
        </Button>
      </CardContent>
    </Card>
  );
}
