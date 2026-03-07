import { eq, and, count } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolMember } from "@/lib/db/schema";

interface CreatePoolData {
  name: string;
  imageUrl?: string | null;
  maxBracketsPerUser: number;
  maxParticipants: number;
}

export async function createPoolWithLeader(
  data: CreatePoolData,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [newPool] = await tx
      .insert(pool)
      .values({
        name: data.name,
        imageUrl: data.imageUrl || null,
        maxBracketsPerUser: data.maxBracketsPerUser,
        maxParticipants: data.maxParticipants,
      })
      .returning();

    await tx.insert(poolMember).values({
      poolId: newPool.id,
      userId,
      role: "leader",
    });

    return newPool;
  });
}

export async function getPoolsByUserId(userId: string) {
  return db
    .select({
      id: pool.id,
      name: pool.name,
      imageUrl: pool.imageUrl,
      maxBracketsPerUser: pool.maxBracketsPerUser,
      maxParticipants: pool.maxParticipants,
      role: poolMember.role,
      joinedAt: poolMember.joinedAt,
    })
    .from(poolMember)
    .innerJoin(pool, eq(poolMember.poolId, pool.id))
    .where(eq(poolMember.userId, userId));
}

export async function getPoolById(poolId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(poolMember)
    .where(and(eq(poolMember.poolId, poolId), eq(poolMember.userId, userId)))
    .limit(1);

  if (!membership) {
    return null;
  }

  const [poolData] = await db
    .select()
    .from(pool)
    .where(eq(pool.id, poolId))
    .limit(1);

  if (!poolData) {
    return null;
  }

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(poolMember)
    .where(eq(poolMember.poolId, poolId));

  return {
    pool: poolData,
    membership,
    memberCount: memberCountResult.count,
  };
}
