"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPoolInviteSchema,
  type CreatePoolInviteFormValues,
  INVITE_LIMITS,
} from "@/lib/validators/pool-invite";
import { createInviteAction } from "./actions";

interface CreateInviteDialogProps {
  poolId: string;
  remainingCapacity: number;
  onInviteCreated: () => void;
}

export function CreateInviteDialog({
  poolId,
  remainingCapacity,
  onInviteCreated,
}: CreateInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<CreatePoolInviteFormValues>({
    resolver: zodResolver(createPoolInviteSchema),
    defaultValues: {
      role: "member",
      expirationDays: INVITE_LIMITS.expirationDays.default,
      maxUses: remainingCapacity > 0 ? remainingCapacity : null,
    },
  });

  async function onSubmit(data: CreatePoolInviteFormValues) {
    const result = await createInviteAction(poolId, data);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const link = `${window.location.origin}/invite/${result.code}`;
    setGeneratedLink(link);
    onInviteCreated();
  }

  function copyLink() {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Invite link copied to clipboard");
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setGeneratedLink(null);
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invite Link</DialogTitle>
          <DialogDescription>
            Generate a shareable link to invite others to this pool.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <p className="mb-2 text-sm font-medium">Invite Link</p>
              <div className="flex items-center gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role for New Members</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="leader">Leader</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires After (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={INVITE_LIMITS.expirationDays.min}
                        max={INVITE_LIMITS.expirationDays.max}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Uses (leave empty for unlimited)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={INVITE_LIMITS.maxUses.min}
                        max={INVITE_LIMITS.maxUses.max}
                        placeholder="Unlimited"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(
                            val === "" ? null : parseInt(val) || 0,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Generating..."
                  : "Generate Invite Link"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
