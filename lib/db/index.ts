import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

function createDb() {
  if (process.env.VERCEL) {
    return drizzleNeon({ connection: process.env.DATABASE_URL!, schema });
  }
  return drizzlePg({ connection: process.env.DATABASE_URL!, schema });
}

export const db = createDb();
