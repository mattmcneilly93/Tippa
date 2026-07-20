"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAppUser } from "@/lib/dev-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { knockoutPointsForRound, knockoutWinnerTeamId, scoreSettingsFromRow } from "@/lib/scoring";
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

const adminKnockoutSchema = z.object({
  groupId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  roundKey: z.enum([
    "round_of_32",
    "round_of_16",
    "quarter_final",
    "semi_final",
    "third_place",
    "final"
  ]),
  slotIndex: z.coerce.number().int().min(0),
  sourceMatchId: z.string().uuid(),
  predictedTeamId: z.string().uuid()
});

// Admins can set or correct any member's knockout pick at any time — before or
// after a match — overriding the per-match lock. Authorized by admin role here,
// then written with the service client so RLS doesn't block the other user_id.
export async function adminSaveKnockoutPrediction(formData: FormData) {
  const parsed = adminKnockoutSchema.parse({
    groupId: formData.get("groupId"),
    targetUserId: formData.get("targetUserId"),
    roundKey: formData.get("roundKey"),
    slotIndex: formData.get("slotIndex"),
    sourceMatchId: formData.get("sourceMatchId"),
    predictedTeamId: formData.get("predictedTeamId")
  });

  await requireGroupAdmin(parsed.groupId);
  const service = createServiceClient();

  const { data: group, error: groupError } = await service
    .from("groups")
    .select("tournament_id")
    .eq("id", parsed.groupId)
    .single();
  if (groupError) throw groupError;

  const { data: membership, error: membershipError } = await service
    .from("group_members")
    .select("user_id")
    .eq("group_id", parsed.groupId)
    .eq("user_id", parsed.targetUserId)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error("That player is not in this group.");

  const [{ data: match, error: matchError }, { data: settingsRow, error: settingsError }] =
    await Promise.all([
      service
        .from("matches")
        .select("tournament_id,stage_type,round_key,home_team_id,away_team_id,status,home_score,away_score,home_penalties,away_penalties")
        .eq("id", parsed.sourceMatchId)
        .single(),
      service.from("group_prediction_settings").select("*").eq("group_id", parsed.groupId).single()
    ]);
  if (matchError) throw matchError;
  if (settingsError) throw settingsError;
  if (match.tournament_id !== group.tournament_id) {
    throw new Error("Match does not belong to this group tournament.");
  }
  if (match.stage_type !== "knockout") throw new Error("Winner pick must be for a knockout fixture.");
  if (match.round_key !== parsed.roundKey) throw new Error("Winner pick round does not match the fixture.");
  if (![match.home_team_id, match.away_team_id].includes(parsed.predictedTeamId)) {
    throw new Error("Winner pick must be one of the fixture teams.");
  }

  // Score just this pick inline — a full-group recalc for a single edit is slow
  // (hundreds of rows) and unnecessary; other members' points are unaffected.
  const winnerTeamId = knockoutWinnerTeamId(match);
  const points =
    winnerTeamId && winnerTeamId === parsed.predictedTeamId
      ? knockoutPointsForRound(parsed.roundKey, scoreSettingsFromRow(settingsRow))
      : 0;

  // Update the member's existing entry for this fixture if there is one, so we
  // never create a second row for the same match (scoring keys on the match).
  const { data: existing, error: existingError } = await service
    .from("knockout_prediction_entries")
    .select("id")
    .eq("group_id", parsed.groupId)
    .eq("user_id", parsed.targetUserId)
    .eq("source_match_id", parsed.sourceMatchId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await service
      .from("knockout_prediction_entries")
      .update({ predicted_team_id: parsed.predictedTeamId, points })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await service.from("knockout_prediction_entries").insert({
      group_id: parsed.groupId,
      user_id: parsed.targetUserId,
      round_key: parsed.roundKey,
      slot_index: parsed.slotIndex,
      source_match_id: parsed.sourceMatchId,
      predicted_team_id: parsed.predictedTeamId,
      points
    });
    if (error) throw error;
  }

  revalidatePath(`/groups/${parsed.groupId}/members/${parsed.targetUserId}`);
  revalidatePath(`/groups/${parsed.groupId}/leaderboard`);
  revalidatePath(`/groups/${parsed.groupId}`);
}
