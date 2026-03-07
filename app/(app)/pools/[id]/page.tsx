import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import { canAccessPoolPage } from "@/lib/permissions/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PoolDetailPage({
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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/pools"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to pools
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold">{poolData.pool.name}</h1>

      <Card className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poolData.pool.imageUrl || "/bracket.webp"}
          alt={poolData.pool.name}
          className="h-48 w-full object-cover"
        />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{poolData.pool.name}</CardTitle>
              <CardDescription>
                You are a {poolData.membership.role} of this pool
              </CardDescription>
            </div>
            {canAccessPoolPage(poolData.membership.role, "settings") && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pools/${id}/settings`}>Settings</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Max Brackets</span>
              <p className="font-medium">
                {poolData.pool.maxBracketsPerUser} per user
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Max Participants</span>
              <p className="font-medium">
                {poolData.memberCount} / {poolData.pool.maxParticipants}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
