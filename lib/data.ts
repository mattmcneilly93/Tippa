import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getGroupContext(groupId: string) {
  const { supabase, user } = await requireUser();
  const { data: group, error } = await supabase
    .from("groups")
    .select("*,tournaments(*),group_prediction_settings(*)")
    .eq("id", groupId)
    .single();

  if (error) throw error;

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("id,user_id,display_name,role,has_paid,profiles(display_name)")
    .eq("group_id", groupId);

  if (membersError) throw membersError;
  const isAdmin = members?.some(
    (member) => member.user_id === user.id && member.role === "admin"
  );

  return {
    supabase,
    user,
    group,
    members: members ?? [],
    isAdmin
  };
}
