import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Placeholder table — will be replaced when real domain models are built
export const healthCheck = pgTable("health_check", {
  id: serial().primaryKey(),
  status: text().notNull().default("ok"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
