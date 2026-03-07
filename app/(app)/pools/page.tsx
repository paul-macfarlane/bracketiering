import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getPoolsByUserId } from "@/lib/db/queries/pools";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PoolsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pools = session ? await getPoolsByUserId(session.user.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Pools</h1>
        <Button asChild>
          <Link href="/pools/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Pool
          </Link>
        </Button>
      </div>

      {pools.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t joined any pools yet.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/pools/create">Create your first pool</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pools.map((pool) => (
            <Link key={pool.id} href={`/pools/${pool.id}`} className="h-full">
              <Card className="flex h-full flex-col overflow-hidden transition-colors hover:border-foreground/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pool.imageUrl || "/bracket.webp"}
                  alt={pool.name}
                  className="h-32 w-full object-cover"
                />
                <CardHeader>
                  <CardTitle className="text-lg">{pool.name}</CardTitle>
                  <CardDescription>
                    {pool.role === "leader" ? "Leader" : "Member"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Max {pool.maxBracketsPerUser} brackets per user</span>
                    <span>Up to {pool.maxParticipants} participants</span>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    View Pool <ArrowRight className="h-4 w-4" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
