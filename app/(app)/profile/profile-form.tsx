"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  profileSchema,
  USERNAME_TAKEN_ERROR,
  type ProfileFormValues,
} from "@/lib/validators/profile";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface ProfileFormProps {
  defaultValues: {
    name: string;
    username: string;
    image: string;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const watchedImage = useWatch({ control: form.control, name: "image" });
  const watchedName = useWatch({ control: form.control, name: "name" });

  async function onSubmit(values: ProfileFormValues) {
    setIsPending(true);
    try {
      const result = await updateProfile(values);
      if (result.error) {
        if (result.error === USERNAME_TAKEN_ERROR) {
          form.setError("username", { message: result.error });
        } else {
          toast.error(result.error);
        }
        return;
      }
      toast.success("Profile updated successfully");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const initials = watchedName ? getInitials(watchedName) : "";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your display name, username, and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex justify-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={watchedImage || undefined} alt={watchedName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your-username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Letters, numbers, hyphens, and underscores only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/photo.jpg"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a URL for your profile picture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
