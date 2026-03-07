import { eq, and, count, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolInvite, poolMember, user } from "@/lib/db/schema";

interface CreatePoolInviteData {
  poolId: string;
  createdBy: string;
  role: "leader" | "member";
  maxUses: number | null;
  expiresAt: Date;
}

export async function createPoolInvite(data: CreatePoolInviteData) {
  const [invite] = await db
    .insert(poolInvite)
    .values({
      poolId: data.poolId,
      createdBy: data.createdBy,
      role: data.role,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
    })
    .returning();

  return invite;
}

export async function getPoolInviteByCode(code: string) {
  const [invite] = await db
    .select({
      id: poolInvite.id,
      code: poolInvite.code,
      poolId: poolInvite.poolId,
      createdBy: poolInvite.createdBy,
      role: poolInvite.role,
      maxUses: poolInvite.maxUses,
      useCount: poolInvite.useCount,
      expiresAt: poolInvite.expiresAt,
      createdAt: poolInvite.createdAt,
      poolName: pool.name,
      poolImageUrl: pool.imageUrl,
      poolMaxParticipants: pool.maxParticipants,
    })
    .from(poolInvite)
    .innerJoin(pool, eq(poolInvite.poolId, pool.id))
    .where(eq(poolInvite.code, code))
    .limit(1);

  return invite ?? null;
}

export async function getPoolInvitesByPoolId(poolId: string) {
  return db
    .select({
      id: poolInvite.id,
      code: poolInvite.code,
      role: poolInvite.role,
      maxUses: poolInvite.maxUses,
      useCount: poolInvite.useCount,
      expiresAt: poolInvite.expiresAt,
      createdAt: poolInvite.createdAt,
      creatorName: user.name,
    })
    .from(poolInvite)
    .innerJoin(user, eq(poolInvite.createdBy, user.id))
    .where(eq(poolInvite.poolId, poolId))
    .orderBy(poolInvite.createdAt);
}

export async function deletePoolInvite(inviteId: string) {
  await db.delete(poolInvite).where(eq(poolInvite.id, inviteId));
}

export async function redeemPoolInvite(
  inviteCode: string,
  userId: string,
): Promise<
  { success: true; poolId: string } | { success: false; error: string }
> {
  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: poolInvite.id,
        poolId: poolInvite.poolId,
        role: poolInvite.role,
        maxUses: poolInvite.maxUses,
        useCount: poolInvite.useCount,
        expiresAt: poolInvite.expiresAt,
      })
      .from(poolInvite)
      .where(eq(poolInvite.code, inviteCode))
      .limit(1);

    if (!invite) {
      return { success: false, error: "Invite link not found." };
    }

    if (invite.expiresAt < new Date()) {
      return { success: false, error: "This invite link has expired." };
    }

    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return {
        success: false,
        error: "This invite link has reached its maximum number of uses.",
      };
    }

    // Check if user is already a member
    const [existingMember] = await tx
      .select()
      .from(poolMember)
      .where(
        and(
          eq(poolMember.poolId, invite.poolId),
          eq(poolMember.userId, userId),
        ),
      )
      .limit(1);

    if (existingMember) {
      return {
        success: false,
        error: "You are already a member of this pool.",
      };
    }

    // Check pool capacity
    const [poolData] = await tx
      .select({ maxParticipants: pool.maxParticipants })
      .from(pool)
      .where(eq(pool.id, invite.poolId))
      .limit(1);

    const [memberCountResult] = await tx
      .select({ count: count() })
      .from(poolMember)
      .where(eq(poolMember.poolId, invite.poolId));

    if (memberCountResult.count >= poolData.maxParticipants) {
      return { success: false, error: "This pool is full." };
    }

    // Add user to pool
    await tx.insert(poolMember).values({
      poolId: invite.poolId,
      userId,
      role: invite.role,
    });

    // Increment use count
    await tx
      .update(poolInvite)
      .set({ useCount: sql`${poolInvite.useCount} + 1` })
      .where(eq(poolInvite.id, invite.id));

    return { success: true, poolId: invite.poolId };
  });
}
