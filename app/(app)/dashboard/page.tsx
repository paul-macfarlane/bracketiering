import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h1 className="text-2xl font-bold">Welcome, {session!.user.name}</h1>
      <p className="text-muted-foreground">
        Signed in as {session!.user.email}
      </p>
    </div>
  );
}
