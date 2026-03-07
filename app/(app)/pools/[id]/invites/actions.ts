"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createPoolInviteSchema } from "@/lib/validators/pool-invite";
import { canPerformPoolAction } from "@/lib/permissions/pools";
import { getPoolById } from "@/lib/db/queries/pools";
import {
  createPoolInvite,
  deletePoolInvite,
} from "@/lib/db/queries/pool-invites";

const createInviteInputSchema = z.object({
  poolId: z.string().min(1),
  formData: createPoolInviteSchema,
});

export async function createInviteAction(poolId: string, formData: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = createInviteInputSchema.safeParse({
    poolId,
    formData,
  });
  if (!inputParsed.success) {
    return { error: inputParsed.error.issues[0].message };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "create-invite")) {
    return { error: "You do not have permission to create invites" };
  }

  const { formData: data } = inputParsed.data;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.expirationDays);

  const invite = await createPoolInvite({
    poolId: inputParsed.data.poolId,
    createdBy: session.user.id,
    role: data.role,
    maxUses: data.maxUses,
    expiresAt,
  });

  return { success: true, code: invite.code };
}

const deleteInviteInputSchema = z.object({
  poolId: z.string().min(1),
  inviteId: z.string().min(1),
});

export async function deleteInviteAction(poolId: string, inviteId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = deleteInviteInputSchema.safeParse({ poolId, inviteId });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "delete-invite")) {
    return { error: "You do not have permission to delete invites" };
  }

  await deletePoolInvite(inputParsed.data.inviteId);

  return { success: true };
}
