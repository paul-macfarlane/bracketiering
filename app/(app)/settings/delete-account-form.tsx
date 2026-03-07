"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteAccount } from "./actions";
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

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isConfirmed = confirmation === CONFIRMATION_TEXT;

  async function handleDelete() {
    if (!isConfirmed) return;

    setIsPending(true);
    try {
      const result = await deleteAccount();
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
    <Card className="border-destructive w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account. This action cannot be undone. Your
          brackets and pool memberships will be anonymized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="confirmation">
            Type <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>{" "}
            to confirm
          </Label>
          <Input
            id="confirmation"
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
          {isPending ? "Deleting..." : "Delete My Account"}
        </Button>
      </CardContent>
    </Card>
  );
}
