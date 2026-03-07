"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { anonymizeAndDeactivateUser } from "@/lib/db/queries/users";

export async function deleteAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  await anonymizeAndDeactivateUser(session.user.id);

  redirect("/login");
}
