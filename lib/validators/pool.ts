import { z } from "zod";

export const POOL_LIMITS = {
  bracketsPerUser: { min: 1, max: 10, default: 5 },
  participants: { min: 2, max: 100, default: 50 },
} as const;

export const createPoolSchema = z.object({
  name: z
    .string()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be 100 characters or less"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  maxBracketsPerUser: z
    .number()
    .int()
    .min(
      POOL_LIMITS.bracketsPerUser.min,
      `Must allow at least ${POOL_LIMITS.bracketsPerUser.min} bracket`,
    )
    .max(
      POOL_LIMITS.bracketsPerUser.max,
      `Maximum ${POOL_LIMITS.bracketsPerUser.max} brackets per user`,
    ),
  maxParticipants: z
    .number()
    .int()
    .min(
      POOL_LIMITS.participants.min,
      `Must allow at least ${POOL_LIMITS.participants.min} participants`,
    )
    .max(
      POOL_LIMITS.participants.max,
      `Maximum ${POOL_LIMITS.participants.max} participants`,
    ),
});

export type CreatePoolFormValues = z.infer<typeof createPoolSchema>;

export function buildUpdatePoolSchema(
  currentMemberCount: number,
  maxBracketCountInPool: number,
) {
  const minBrackets = Math.max(
    POOL_LIMITS.bracketsPerUser.min,
    maxBracketCountInPool,
  );
  const minParticipants = Math.max(
    POOL_LIMITS.participants.min,
    currentMemberCount,
  );

  return z.object({
    name: z
      .string()
      .min(1, "Pool name is required")
      .max(100, "Pool name must be 100 characters or less"),
    imageUrl: z
      .string()
      .url("Must be a valid URL")
      .or(z.literal(""))
      .optional(),
    maxBracketsPerUser: z
      .number()
      .int()
      .min(
        minBrackets,
        maxBracketCountInPool > POOL_LIMITS.bracketsPerUser.min
          ? `Cannot be less than ${maxBracketCountInPool} (a member already has that many brackets)`
          : `Must allow at least ${POOL_LIMITS.bracketsPerUser.min} bracket`,
      )
      .max(
        POOL_LIMITS.bracketsPerUser.max,
        `Maximum ${POOL_LIMITS.bracketsPerUser.max} brackets per user`,
      ),
    maxParticipants: z
      .number()
      .int()
      .min(
        minParticipants,
        currentMemberCount > POOL_LIMITS.participants.min
          ? `Cannot be less than ${currentMemberCount} (current member count)`
          : `Must allow at least ${POOL_LIMITS.participants.min} participants`,
      )
      .max(
        POOL_LIMITS.participants.max,
        `Maximum ${POOL_LIMITS.participants.max} participants`,
      ),
  });
}

export type UpdatePoolFormValues = z.infer<
  ReturnType<typeof buildUpdatePoolSchema>
>;
