"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  calculateExactScoreResult,
  calculateOutcomePoints,
  defaultScoreSettings,
  type MatchOutcome,
  type RoundKey
} from "@/lib/scoring";

const tableSchema = z.object({
  groupId: z.string().uuid(),
  groupName: z.string().min(1),
  rankedTeamIds: z.array(z.string().uuid()).min(2)
});

const matchSchema = z.object({
  groupId: z.string().uuid(),
  matchId: z.string().uuid(),
  predictionPhase: z.enum(["group", "knockout"]).default("group"),
  predictedOutcome: z.enum(["home", "draw", "away"]).optional(),
  homeScore: z.coerce.number().int().min(0).max(99).optional(),
  awayScore: z.coerce.number().int().min(0).max(99).optional()
});

const knockoutSchema = z.object({
  groupId: z.string().uuid(),
  roundKey: z.enum(["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"]),
  slotIndex: z.coerce.number().int().min(0),
  sourceMatchId: z.string().uuid().optional(),
  predictedTeamId: z.string().uuid()
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function assertGroupStageUnlocked(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
  const { data: group, error } = await supabase
    .from("groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (error) throw error;

  const { data: firstMatch, error: matchError } = await supabase
    .from("matches")
    .select("kickoff_time")
    .eq("tournament_id", group.tournament_id)
    .eq("stage_type", "group")
    .order("kickoff_time", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (matchError) throw matchError;
  if (firstMatch?.kickoff_time && new Date(firstMatch.kickoff_time) <= new Date()) {
    throw new Error("Group-stage predictions are locked.");
  }
}

async function assertKnockoutUnlocked(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
  const { data: settings, error } = await supabase
    .from("group_prediction_settings")
    .select("knockout_opened_at,knockout_locked_at")
    .eq("group_id", groupId)
    .single();

  if (error) throw error;
  if (!settings.knockout_opened_at) throw new Error("Knockout predictions are not open yet.");
  if (settings.knockout_locked_at && new Date(settings.knockout_locked_at) <= new Date()) {
    throw new Error("Knockout predictions are locked.");
  }
}

export async function saveGroupTablePrediction(formData: FormData) {
  const rankedTeamIds = formData.getAll("rankedTeamIds").map(String).filter(Boolean);
  const parsed = tableSchema.parse({
    groupId: formData.get("groupId"),
    groupName: formData.get("groupName"),
    rankedTeamIds
  });
  const { supabase, user } = await requireUser();
  await assertGroupStageUnlocked(supabase, parsed.groupId);

  const { error } = await supabase.from("group_table_predictions").upsert(
    {
      group_id: parsed.groupId,
      user_id: user.id,
      group_name: parsed.groupName,
      ranked_team_ids: parsed.rankedTeamIds
    },
    { onConflict: "group_id,user_id,group_name" }
  );

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
}

export async function saveMatchPrediction(formData: FormData) {
  const parsed = matchSchema.parse({
    groupId: formData.get("groupId"),
    matchId: formData.get("matchId"),
    predictionPhase: formData.get("predictionPhase") || "group",
    predictedOutcome: formData.get("predictedOutcome") || undefined,
    homeScore: formData.get("homeScore") || undefined,
    awayScore: formData.get("awayScore") || undefined
  });
  const { supabase, user } = await requireUser();
  if (parsed.predictionPhase === "knockout") {
    await assertKnockoutUnlocked(supabase, parsed.groupId);
  } else {
    await assertGroupStageUnlocked(supabase, parsed.groupId);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("status,home_score,away_score")
    .eq("id", parsed.matchId)
    .single();

  if (matchError) throw matchError;

  const exactResult =
    parsed.homeScore != null && parsed.awayScore != null
      ? calculateExactScoreResult(
          { homeScore: parsed.homeScore, awayScore: parsed.awayScore },
          { status: match.status, homeScore: match.home_score, awayScore: match.away_score },
          defaultScoreSettings
        )
      : null;
  const outcomePoints = parsed.predictedOutcome
    ? calculateOutcomePoints(
        parsed.predictedOutcome as MatchOutcome,
        { status: match.status, homeScore: match.home_score, awayScore: match.away_score },
        defaultScoreSettings
      )
    : 0;

  const { error } = await supabase.from("match_predictions").upsert(
    {
      group_id: parsed.groupId,
      user_id: user.id,
      match_id: parsed.matchId,
      prediction_phase: parsed.predictionPhase,
      predicted_outcome: parsed.predictedOutcome ?? null,
      home_score: parsed.homeScore ?? null,
      away_score: parsed.awayScore ?? null,
      points: exactResult?.points ?? outcomePoints,
      exact_score: exactResult?.exactScore ?? false,
      correct_outcome: exactResult?.correctOutcome ?? outcomePoints > 0,
      correct_goal_difference: exactResult?.correctGoalDifference ?? false
    },
    { onConflict: "group_id,user_id,match_id" }
  );

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
}

export async function saveKnockoutPrediction(formData: FormData) {
  const parsed = knockoutSchema.parse({
    groupId: formData.get("groupId"),
    roundKey: formData.get("roundKey"),
    slotIndex: formData.get("slotIndex"),
    sourceMatchId: formData.get("sourceMatchId") || undefined,
    predictedTeamId: formData.get("predictedTeamId")
  });
  const { supabase, user } = await requireUser();
  await assertKnockoutUnlocked(supabase, parsed.groupId);

  const { error } = await supabase.from("knockout_prediction_entries").upsert(
    {
      group_id: parsed.groupId,
      user_id: user.id,
      round_key: parsed.roundKey as RoundKey,
      slot_index: parsed.slotIndex,
      source_match_id: parsed.sourceMatchId ?? null,
      predicted_team_id: parsed.predictedTeamId
    },
    { onConflict: "group_id,user_id,round_key,slot_index" }
  );

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}/predictions`);
}
