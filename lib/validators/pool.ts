import { z } from "zod";

export const createPoolSchema = z.object({
  name: z
    .string()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be 100 characters or less"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  maxBracketsPerUser: z
    .number()
    .int()
    .min(1, "Must allow at least 1 bracket")
    .max(10, "Maximum 10 brackets per user"),
  maxParticipants: z
    .number()
    .int()
    .min(2, "Must allow at least 2 participants")
    .max(100, "Maximum 100 participants"),
});

export type CreatePoolFormValues = z.infer<typeof createPoolSchema>;
