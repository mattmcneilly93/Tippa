"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculatePredictionResult, defaultScoreSettings } from "@/lib/scoring";

const schema = z.object({
  groupId: z.string().uuid(),
  matchId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99)
});

export async function savePrediction(formData: FormData) {
  const parsed = schema.parse({
    groupId: formData.get("groupId"),
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore")
  });
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,kickoff_time,status,home_score,away_score")
    .eq("id", parsed.matchId)
    .single();

  if (matchError) throw matchError;

  const { data: override } = await supabase
    .from("group_match_overrides")
    .select("kickoff_time,status,home_score,away_score")
    .eq("group_id", parsed.groupId)
    .eq("match_id", parsed.matchId)
    .maybeSingle();

  const effectiveKickoff = override?.kickoff_time ?? match.kickoff_time;
  if (effectiveKickoff && new Date(effectiveKickoff) <= new Date()) {
    throw new Error("Predictions are locked for this match.");
  }

  const result = calculatePredictionResult(
    { homeScore: parsed.homeScore, awayScore: parsed.awayScore },
    {
      status: override?.status ?? match.status,
      homeScore: override?.home_score ?? match.home_score,
      awayScore: override?.away_score ?? match.away_score
    },
    defaultScoreSettings
  );

  const { error } = await supabase.from("predictions").upsert(
    {
      group_id: parsed.groupId,
      match_id: parsed.matchId,
      user_id: user.id,
      home_score: parsed.homeScore,
      away_score: parsed.awayScore,
      points: result.points,
      exact_score: result.exactScore,
      correct_outcome: result.correctOutcome,
      correct_goal_difference: result.correctGoalDifference
    },
    { onConflict: "group_id,match_id,user_id" }
  );

  if (error) throw error;
  revalidatePath(`/groups/${parsed.groupId}`);
}
