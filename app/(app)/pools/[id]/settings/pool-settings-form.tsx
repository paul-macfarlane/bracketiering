"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  buildUpdatePoolSchema,
  POOL_LIMITS,
  type UpdatePoolFormValues,
} from "@/lib/validators/pool";
import { updatePoolSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SCORING } from "@/lib/scoring";

interface PoolSettingsFormProps {
  poolId: string;
  defaultValues: {
    name: string;
    imageUrl: string;
    maxBracketsPerUser: number;
    maxParticipants: number;
  };
  memberCount: number;
  maxBracketCountInPool: number;
}

export function PoolSettingsForm({
  poolId,
  defaultValues,
  memberCount,
  maxBracketCountInPool,
}: PoolSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const schema = buildUpdatePoolSchema(memberCount, maxBracketCountInPool);

  const form = useForm<UpdatePoolFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedImageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  });

  async function onSubmit(values: UpdatePoolFormValues) {
    setIsPending(true);
    const result = await updatePoolSettings(poolId, values);
    if (result?.error) {
      toast.error(result.error);
    }
    setIsPending(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pool Name</FormLabel>
              <FormControl>
                <Input placeholder="My Bracket Pool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/pool-image.jpg"
                  {...field}
                  onChange={(e) => {
                    setImageError(false);
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                An image to represent your pool.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              watchedImageUrl && !imageError ? watchedImageUrl : "/bracket.webp"
            }
            alt="Pool image preview"
            className="h-40 w-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
        {watchedImageUrl && imageError && (
          <p className="text-xs text-muted-foreground">
            Unable to load image preview. The default image will be used.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxBracketsPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Brackets per User</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={Math.max(
                      POOL_LIMITS.bracketsPerUser.min,
                      maxBracketCountInPool,
                    )}
                    max={POOL_LIMITS.bracketsPerUser.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {maxBracketCountInPool > POOL_LIMITS.bracketsPerUser.min
                    ? `${maxBracketCountInPool}-${POOL_LIMITS.bracketsPerUser.max} (min set by existing brackets)`
                    : `${POOL_LIMITS.bracketsPerUser.min}-${POOL_LIMITS.bracketsPerUser.max}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={Math.max(POOL_LIMITS.participants.min, memberCount)}
                    max={POOL_LIMITS.participants.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {memberCount > POOL_LIMITS.participants.min
                    ? `${memberCount}-${POOL_LIMITS.participants.max} (min set by current members)`
                    : `${POOL_LIMITS.participants.min}-${POOL_LIMITS.participants.max}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-medium">Scoring</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Scoring customization will be available in a future update.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">First Four</span>
              <span>{DEFAULT_SCORING.firstFour} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round of 64</span>
              <span>{DEFAULT_SCORING.round64} pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round of 32</span>
              <span>{DEFAULT_SCORING.round32} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sweet 16</span>
              <span>{DEFAULT_SCORING.sweet16} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elite 8</span>
              <span>{DEFAULT_SCORING.elite8} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final Four</span>
              <span>{DEFAULT_SCORING.finalFour} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Championship</span>
              <span>{DEFAULT_SCORING.championship} pts</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
