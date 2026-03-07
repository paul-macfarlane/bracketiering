import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreatePoolForm } from "./create-pool-form";

export default function CreatePoolPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a Bracket Pool</CardTitle>
          <CardDescription>
            Set up a pool for your friends to compete in. You&apos;ll be the
            pool leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePoolForm />
        </CardContent>
      </Card>
    </div>
  );
}
