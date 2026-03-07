import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPoolInviteByCode } from "@/lib/db/queries/pool-invites";
import { InviteAcceptCard } from "./invite-accept-card";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?callbackUrl=/invite/${code}`);
  }

  const invite = await getPoolInviteByCode(code);

  if (!invite) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invalid Invite"
          message="This invite link is not valid or has been deleted."
        />
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invite Expired"
          message="This invite link has expired. Please ask for a new one."
        />
      </div>
    );
  }

  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invite Exhausted"
          message="This invite link has reached its maximum number of uses."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <InviteAcceptCard
        code={code}
        poolName={invite.poolName}
        poolImageUrl={invite.poolImageUrl}
        role={invite.role}
      />
    </div>
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
