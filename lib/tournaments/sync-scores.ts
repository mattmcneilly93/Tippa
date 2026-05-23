import { createServiceClient } from "@/lib/supabase/server";
import { calculatePredictionResult, defaultScoreSettings } from "@/lib/scoring";

type PredictionRow = {
  id: string;
  group_id: string;
  home_score: number;
  away_score: number;
  matches: {
    id: string;
    status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
    home_score: number | null;
    away_score: number | null;
  } | null;
};

export async function recalculateScoresForTournament(tournamentId: string) {
  const supabase = createServiceClient();
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("id,group_id,home_score,away_score,matches!inner(id,status,home_score,away_score,tournament_id)")
    .eq("matches.tournament_id", tournamentId);

  if (error) throw error;
  await recalculatePredictionRows(predictions as unknown as PredictionRow[]);
}

export async function recalculateScoresForGroup(groupId: string) {
  const supabase = createServiceClient();
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("id,group_id,home_score,away_score,matches(id,status,home_score,away_score)")
    .eq("group_id", groupId);

  if (error) throw error;
  const { data: overrides, error: overrideError } = await supabase
    .from("group_match_overrides")
    .select("match_id,status,home_score,away_score")
    .eq("group_id", groupId);

  if (overrideError) throw overrideError;
  const overrideByMatch = new Map(overrides?.map((override) => [override.match_id, override]));
  const merged = (predictions as unknown as PredictionRow[]).map((prediction) => {
    const override = prediction.matches ? overrideByMatch.get(prediction.matches.id) : null;
    if (!override || !prediction.matches) return prediction;
    return {
      ...prediction,
      matches: {
        ...prediction.matches,
        status: override.status,
        home_score: override.home_score,
        away_score: override.away_score
      }
    };
  });

  await recalculatePredictionRows(merged);
}

async function recalculatePredictionRows(predictions: PredictionRow[]) {
  const supabase = createServiceClient();

  for (const prediction of predictions ?? []) {
    if (!prediction.matches) continue;

    const { data: settings } = await supabase
      .from("group_score_settings")
      .select("exact_score_points,correct_goal_difference_points,correct_outcome_points")
      .eq("group_id", prediction.group_id)
      .maybeSingle();

    const result = calculatePredictionResult(
      {
        homeScore: prediction.home_score,
        awayScore: prediction.away_score
      },
      {
        status: prediction.matches.status,
        homeScore: prediction.matches.home_score,
        awayScore: prediction.matches.away_score
      },
      settings
        ? {
            exactScorePoints: settings.exact_score_points,
            correctGoalDifferencePoints: settings.correct_goal_difference_points,
            correctOutcomePoints: settings.correct_outcome_points
          }
        : defaultScoreSettings
    );

    await supabase
      .from("predictions")
      .update({
        points: result.points,
        exact_score: result.exactScore,
        correct_outcome: result.correctOutcome,
        correct_goal_difference: result.correctGoalDifference
      })
      .eq("id", prediction.id);
  }
}
