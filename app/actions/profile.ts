"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  displayName: z.string().trim().min(2).max(40)
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
