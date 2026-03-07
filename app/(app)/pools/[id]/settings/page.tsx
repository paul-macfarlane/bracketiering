import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import {
  getPoolById,
  getMaxBracketCountInPool,
  hasTournamentStarted,
} from "@/lib/db/queries/pools";
import { canAccessPoolPage } from "@/lib/permissions/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PoolSettingsForm } from "./pool-settings-form";
import { DeletePoolForm } from "./delete-pool-form";

export default async function PoolSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  const poolData = await getPoolById(id, session.user.id);

  if (!poolData) {
    notFound();
  }

  if (!canAccessPoolPage(poolData.membership.role, "settings")) {
    notFound();
  }

  const tournamentStarted = await hasTournamentStarted();
  const maxBracketCountInPool = await getMaxBracketCountInPool(id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href={`/pools/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to pool
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold">{poolData.pool.name} Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pool Settings</CardTitle>
          <CardDescription>
            {tournamentStarted
              ? "Settings are locked because the tournament has started."
              : "Update your pool settings. Changes are allowed until the tournament begins."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentStarted ? (
            <p className="text-sm text-muted-foreground">
              Pool settings cannot be modified after the tournament has started.
            </p>
          ) : (
            <PoolSettingsForm
              poolId={id}
              defaultValues={{
                name: poolData.pool.name,
                imageUrl: poolData.pool.imageUrl ?? "",
                maxBracketsPerUser: poolData.pool.maxBracketsPerUser,
                maxParticipants: poolData.pool.maxParticipants,
              }}
              memberCount={poolData.memberCount}
              maxBracketCountInPool={maxBracketCountInPool}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <DeletePoolForm poolId={id} />
      </div>
    </div>
  );
}
