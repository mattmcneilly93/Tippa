"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncTournament } from "@/lib/tournaments/sync";
import { recalculateScoresForGroup } from "@/lib/tournaments/sync-scores";

const overrideSchema = z.object({
  groupId: z.string().uuid(),
  matchId: z.string().uuid(),
  kickoffTime: z.string().optional(),
  status: z.enum(["scheduled", "live", "finished", "postponed", "cancelled"]),
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional()
});

const syncSchema = z.object({
  groupId: z.string().uuid()
});

async function requireGroupAdmin(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (member?.role !== "admin") throw new Error("Forbidden");

  return { supabase, user };
}

export async function saveMatchOverride(formData: FormData) {
  const parsed = overrideSchema.parse({
    groupId: formData.get("groupId"),
    matchId: formData.get("matchId"),
    kickoffTime: formData.get("kickoffTime") || undefined,
    status: formData.get("status"),
    homeScore: formData.get("homeScore") || undefined,
    awayScore: formData.get("awayScore") || undefined
  });

  const { supabase, user } = await requireGroupAdmin(parsed.groupId);

  const { error } = await supabase.from("group_match_overrides").upsert(
    {
      group_id: parsed.groupId,
      match_id: parsed.matchId,
      kickoff_time: parsed.kickoffTime || null,
      status: parsed.status,
      home_score: parsed.homeScore ?? null,
      away_score: parsed.awayScore ?? null,
      manually_updated_by: user.id
    },
    { onConflict: "group_id,match_id" }
  );

  if (error) throw error;
  await recalculateScoresForGroup(parsed.groupId);
  revalidatePath(`/groups/${parsed.groupId}`);
}

export async function syncTournamentForGroup(formData: FormData) {
  const parsed = syncSchema.parse({
    groupId: formData.get("groupId")
  });

  const { supabase } = await requireGroupAdmin(parsed.groupId);
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("tournament_id")
    .eq("id", parsed.groupId)
    .single();

  if (groupError) throw groupError;

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("code")
    .eq("id", group.tournament_id)
    .single();

  if (tournamentError) throw tournamentError;

  await syncTournament(tournament.code);
  revalidatePath(`/groups/${parsed.groupId}`);
  revalidatePath(`/groups/${parsed.groupId}/leaderboard`);
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
  revalidatePath(`/groups/${parsed.groupId}/admin`);
}
