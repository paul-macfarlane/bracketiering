"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { profileSchema, USERNAME_TAKEN_ERROR } from "@/lib/validators/profile";
import { isUsernameTaken, updateUserProfile } from "@/lib/db/queries/users";

export async function updateProfile(formData: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = profileSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, username, image } = parsed.data;

  const taken = await isUsernameTaken(username, session.user.id);
  if (taken) {
    return { error: USERNAME_TAKEN_ERROR };
  }

  const updated = await updateUserProfile(session.user.id, {
    name,
    username,
    image: image || null,
  });

  if (!updated) {
    return { error: "Failed to update profile" };
  }

  return { success: true };
}
