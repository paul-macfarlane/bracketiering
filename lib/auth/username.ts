import { generateFromEmail } from "unique-username-generator";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const MAX_ATTEMPTS = 10;

export async function generateUniqueUsername(email: string): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = generateFromEmail(email, 3);
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, candidate))
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }
  }

  // Fallback: append timestamp to guarantee uniqueness
  return generateFromEmail(email, 3) + Date.now();
}
