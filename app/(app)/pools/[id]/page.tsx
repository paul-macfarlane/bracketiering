import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card className="overflow-hidden">
        {poolData.pool.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={poolData.pool.imageUrl}
            alt={poolData.pool.name}
            className="h-48 w-full object-cover"
          />
        )}
        <CardHeader>
          <CardTitle>{poolData.pool.name}</CardTitle>
          <CardDescription>
            You are a {poolData.membership.role} of this pool
          </CardDescription>
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
