"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deletePoolAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CONFIRMATION_TEXT = "DELETE";

export function DeletePoolForm({ poolId }: { poolId: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isConfirmed = confirmation === CONFIRMATION_TEXT;

  async function handleDelete() {
    if (!isConfirmed) return;

    setIsPending(true);
    try {
      const result = await deletePoolAction(poolId);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch {
      // redirect throws in server actions, which is expected
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Pool</CardTitle>
        <CardDescription>
          Permanently delete this pool and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delete-confirmation">
            Type{" "}
            <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span> to
            confirm
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
            autoComplete="off"
          />
        </div>
        <Button
          variant="destructive"
          className="w-full"
          disabled={!isConfirmed || isPending}
          onClick={handleDelete}
        >
          {isPending ? "Deleting..." : "Delete Pool"}
        </Button>
      </CardContent>
    </Card>
  );
}
