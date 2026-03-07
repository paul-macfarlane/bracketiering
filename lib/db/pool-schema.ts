import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { DEFAULT_SCORING } from "@/lib/scoring";

export const poolMemberRoleEnum = pgEnum("pool_member_role", [
  "leader",
  "member",
]);

export const pool = pgTable("pool", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  maxBracketsPerUser: integer("max_brackets_per_user").notNull().default(5),
  maxParticipants: integer("max_participants").notNull().default(50),
  scoringFirstFour: integer("scoring_first_four")
    .notNull()
    .default(DEFAULT_SCORING.firstFour),
  scoringRound64: integer("scoring_round_64")
    .notNull()
    .default(DEFAULT_SCORING.round64),
  scoringRound32: integer("scoring_round_32")
    .notNull()
    .default(DEFAULT_SCORING.round32),
  scoringSweet16: integer("scoring_sweet_16")
    .notNull()
    .default(DEFAULT_SCORING.sweet16),
  scoringElite8: integer("scoring_elite_8")
    .notNull()
    .default(DEFAULT_SCORING.elite8),
  scoringFinalFour: integer("scoring_final_four")
    .notNull()
    .default(DEFAULT_SCORING.finalFour),
  scoringChampionship: integer("scoring_championship")
    .notNull()
    .default(DEFAULT_SCORING.championship),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const poolMember = pgTable(
  "pool_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    poolId: text("pool_id")
      .notNull()
      .references(() => pool.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: poolMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("pool_member_pool_id_idx").on(table.poolId),
    index("pool_member_user_id_idx").on(table.userId),
  ],
);

export const poolRelations = relations(pool, ({ many }) => ({
  members: many(poolMember),
}));

export const poolMemberRelations = relations(poolMember, ({ one }) => ({
  pool: one(pool, {
    fields: [poolMember.poolId],
    references: [pool.id],
  }),
  user: one(user, {
    fields: [poolMember.userId],
    references: [user.id],
  }),
}));
