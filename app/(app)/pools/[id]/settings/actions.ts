"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { buildUpdatePoolSchema } from "@/lib/validators/pool";
import { canPerformPoolAction } from "@/lib/permissions/pools";
import {
  getPoolById,
  getPoolMemberCount,
  getMaxBracketCountInPool,
  updatePool,
  deletePool,
  hasTournamentStarted,
} from "@/lib/db/queries/pools";

const updatePoolSettingsInputSchema = z.object({
  poolId: z.string().min(1),
  formData: z.record(z.string(), z.unknown()),
});

export async function updatePoolSettings(poolId: string, formData: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = updatePoolSettingsInputSchema.safeParse({
    poolId,
    formData,
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "update-settings")) {
    return { error: "You do not have permission to edit pool settings" };
  }

  const tournamentStarted = await hasTournamentStarted();
  if (tournamentStarted) {
    return { error: "Settings cannot be changed after the tournament starts" };
  }

  const memberCount = await getPoolMemberCount(inputParsed.data.poolId);
  const maxBracketCount = await getMaxBracketCountInPool(
    inputParsed.data.poolId,
  );

  const schema = buildUpdatePoolSchema(memberCount, maxBracketCount);
  const parsed = schema.safeParse(inputParsed.data.formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updatePool(inputParsed.data.poolId, parsed.data);

  redirect(`/pools/${inputParsed.data.poolId}`);
}

const deletePoolInputSchema = z.object({
  poolId: z.string().min(1),
});

export async function deletePoolAction(poolId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = deletePoolInputSchema.safeParse({ poolId });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "delete-pool")) {
    return { error: "You do not have permission to delete this pool" };
  }

  await deletePool(inputParsed.data.poolId);

  redirect("/pools");
}
