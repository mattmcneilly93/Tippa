"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAppUser } from "@/lib/dev-auth";
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
  const { supabase, user } = await requireAppUser();

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

export async function openKnockoutPredictions(formData: FormData) {
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

  const { data: firstKnockout, error: matchError } = await supabase
    .from("matches")
    .select("kickoff_time")
    .eq("tournament_id", group.tournament_id)
    .eq("stage_type", "knockout")
    .neq("home_team_name", "TBD")
    .neq("away_team_name", "TBD")
    .order("round_order", { ascending: true })
    .order("kickoff_time", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!firstKnockout) throw new Error("No known knockout fixtures are available yet.");

  const { error } = await supabase
    .from("group_prediction_settings")
    .update({
      knockout_opened_at: new Date().toISOString(),
      knockout_locked_at: firstKnockout.kickoff_time
    })
    .eq("group_id", parsed.groupId);

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}`);
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
  revalidatePath(`/groups/${parsed.groupId}/admin`);
}

export async function recalculateGroupPredictionScores(formData: FormData) {
  const parsed = syncSchema.parse({
    groupId: formData.get("groupId")
  });

  await requireGroupAdmin(parsed.groupId);
  await recalculateScoresForGroup(parsed.groupId);
  revalidatePath(`/groups/${parsed.groupId}`);
  revalidatePath(`/groups/${parsed.groupId}/leaderboard`);
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
  revalidatePath(`/groups/${parsed.groupId}/admin`);
}
