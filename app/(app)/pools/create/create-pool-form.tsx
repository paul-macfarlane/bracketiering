"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  createPoolSchema,
  type CreatePoolFormValues,
} from "@/lib/validators/pool";
import { createPool } from "./actions";
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

export function CreatePoolForm() {
  const [isPending, setIsPending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const form = useForm<CreatePoolFormValues>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
      maxBracketsPerUser: 5,
      maxParticipants: 50,
    },
  });

  const watchedImageUrl = useWatch({ control: form.control, name: "imageUrl" });

  async function onSubmit(values: CreatePoolFormValues) {
    setIsPending(true);
    const result = await createPool(values);
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

        {watchedImageUrl && !imageError && (
          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watchedImageUrl}
              alt="Pool image preview"
              className="h-40 w-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        {watchedImageUrl && imageError && (
          <p className="text-xs text-muted-foreground">
            Unable to load image preview.
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
                  <Input type="number" min={1} max={10} {...field} />
                </FormControl>
                <FormDescription>1-10</FormDescription>
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
                  <Input type="number" min={2} max={100} {...field} />
                </FormControl>
                <FormDescription>2-100</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-medium">Default Scoring</h3>
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
            {isPending ? "Creating..." : "Create Pool"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
