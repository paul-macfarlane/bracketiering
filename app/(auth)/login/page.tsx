import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginButtons } from "./login-buttons";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">BRacketiering</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to start competing
          </p>
        </div>
        <LoginButtons />
      </div>
    </div>
  );
}
