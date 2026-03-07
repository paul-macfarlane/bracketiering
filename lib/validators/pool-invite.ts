import { z } from "zod";

export const INVITE_LIMITS = {
  expirationDays: { min: 1, max: 30, default: 7 },
  maxUses: { min: 1, max: 100 },
} as const;

export const createPoolInviteSchema = z.object({
  role: z.enum(["member", "leader"]),
  expirationDays: z
    .number()
    .int()
    .min(
      INVITE_LIMITS.expirationDays.min,
      `Must be at least ${INVITE_LIMITS.expirationDays.min} day`,
    )
    .max(
      INVITE_LIMITS.expirationDays.max,
      `Must be at most ${INVITE_LIMITS.expirationDays.max} days`,
    ),
  maxUses: z
    .number()
    .int()
    .min(
      INVITE_LIMITS.maxUses.min,
      `Must be at least ${INVITE_LIMITS.maxUses.min}`,
    )
    .max(
      INVITE_LIMITS.maxUses.max,
      `Must be at most ${INVITE_LIMITS.maxUses.max}`,
    )
    .nullable(),
});

export type CreatePoolInviteFormValues = z.infer<typeof createPoolInviteSchema>;
