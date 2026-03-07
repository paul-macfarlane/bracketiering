import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
  image: z.string().url("Must be a valid URL").or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const USERNAME_TAKEN_ERROR = "Username is already taken";
