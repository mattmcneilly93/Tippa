"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  displayName: z.string().trim().min(2).max(40)
});

const groupDisplayNameSchema = schema.extend({
  groupId: z.string().uuid()
});

export async function updateProfile(formData: FormData) {
  const parsed = schema.parse({
    displayName: formData.get("displayName")
  });
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.displayName
  });

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateGroupDisplayName(formData: FormData) {
  const parsed = groupDisplayNameSchema.parse({
    groupId: formData.get("groupId"),
    displayName: formData.get("displayName")
  });
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("group_members")
    .update({ display_name: parsed.displayName })
    .eq("group_id", parsed.groupId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}`);
  revalidatePath(`/groups/${parsed.groupId}/leaderboard`);
  revalidatePath(`/groups/${parsed.groupId}/settings`);
}
