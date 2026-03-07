import { eq, and, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function getUserById(id: string) {
  const result = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return result[0] ?? null;
}

export async function isUsernameTaken(
  username: string,
  excludeUserId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.username, username), ne(user.id, excludeUserId)))
    .limit(1);
  return result.length > 0;
}

export async function updateUserProfile(
  userId: string,
  data: { name: string; username: string; image: string | null },
) {
  const result = await db
    .update(user)
    .set(data)
    .where(eq(user.id, userId))
    .returning();
  return result[0] ?? null;
}
