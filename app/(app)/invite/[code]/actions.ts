"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { redeemPoolInvite } from "@/lib/db/queries/pool-invites";

export async function acceptInviteAction(code: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const result = await redeemPoolInvite(code, session.user.id);

  if (!result.success) {
    return { error: result.error };
  }

  redirect(`/pools/${result.poolId}`);
}
