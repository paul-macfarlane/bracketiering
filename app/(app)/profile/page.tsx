import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col items-center py-10">
      <ProfileForm
        defaultValues={{
          name: session!.user.name,
          username:
            ((session!.user as Record<string, unknown>).username as string) ??
            "",
          image: session!.user.image ?? "",
        }}
      />
    </div>
  );
}
