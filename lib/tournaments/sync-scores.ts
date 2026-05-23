import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateExactScoreResult,
  calculateGroupTablePoints,
  calculateOutcomePoints,
  knockoutPointsForRound,
  outcomeForScore,
  scoreSettingsFromRow,
  type MatchOutcome,
  type RoundKey,
  type ScoreSettings
} from "@/lib/scoring";

type MatchRow = {
  id: string;
  tournament_id: string;
  group_name: string | null;
  stage_type: "group" | "knockout";
  round_key: RoundKey;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
};

type SettingsRow = Partial<ScoreSettings> & {
  group_id: string;
};

function winnerTeamId(match: MatchRow) {
  if (
    match.status !== "finished" ||
    match.home_score == null ||
    match.away_score == null ||
    !match.home_team_id ||
    !match.away_team_id ||
    match.home_score === match.away_score
  ) {
    return null;
  }
  return match.home_score > match.away_score ? match.home_team_id : match.away_team_id;
}

function groupStandings(matches: MatchRow[]) {
  const table = new Map<string, { teamId: string; points: number; goalDifference: number; goalsFor: number }>();

  for (const match of matches) {
    if (
      match.status !== "finished" ||
      !match.home_team_id ||
      !match.away_team_id ||
      match.home_score == null ||
      match.away_score == null
    ) {
      continue;
    }

    const home = table.get(match.home_team_id) ?? {
      teamId: match.home_team_id,
      points: 0,
      goalDifference: 0,
      goalsFor: 0
    };
    const away = table.get(match.away_team_id) ?? {
      teamId: match.away_team_id,
      points: 0,
      goalDifference: 0,
      goalsFor: 0
    };

    home.goalsFor += match.home_score;
    away.goalsFor += match.away_score;
    home.goalDifference += match.home_score - match.away_score;
    away.goalDifference += match.away_score - match.home_score;

    if (match.home_score > match.away_score) {
      home.points += 3;
    } else if (match.home_score < match.away_score) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }

    table.set(home.teamId, home);
    table.set(away.teamId, away);
  }

  return [...table.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamId.localeCompare(b.teamId)
    )
    .map((row) => row.teamId);
}

function settingsByGroup(rows: SettingsRow[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.group_id, scoreSettingsFromRow(row)]));
}

export async function recalculateScoresForTournament(tournamentId: string) {
  const supabase = createServiceClient();
  const [{ data: matches, error: matchesError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("matches").select("*").eq("tournament_id", tournamentId),
      supabase
        .from("group_prediction_settings")
        .select("*,groups!inner(tournament_id)")
        .eq("groups.tournament_id", tournamentId)
    ]);

  if (matchesError) throw matchesError;
  if (settingsError) throw settingsError;

  await recalculateWithMatches(matches as MatchRow[], settings as unknown as SettingsRow[]);
}

export async function recalculateScoresForGroup(groupId: string) {
  const supabase = createServiceClient();
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("tournament_id")
    .eq("id", groupId)
    .single();

  if (groupError) throw groupError;

  const [{ data: matches, error: matchesError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("matches").select("*").eq("tournament_id", group.tournament_id),
      supabase.from("group_prediction_settings").select("*").eq("group_id", groupId)
    ]);

  if (matchesError) throw matchesError;
  if (settingsError) throw settingsError;

  await recalculateWithMatches(matches as MatchRow[], settings as unknown as SettingsRow[]);
}

async function recalculateWithMatches(matches: MatchRow[], settingsRows: SettingsRow[]) {
  const supabase = createServiceClient();
  const groupIds = settingsRows.map((row) => row.group_id);
  if (!groupIds.length) return;
  const settingsMap = settingsByGroup(settingsRows);
  const matchById = new Map(matches.map((match) => [match.id, match]));

  const { data: tablePredictions, error: tableError } = await supabase
    .from("group_table_predictions")
    .select("id,group_id,group_name,ranked_team_ids")
    .in("group_id", groupIds);
  if (tableError) throw tableError;

  for (const prediction of tablePredictions ?? []) {
    const actual = groupStandings(
      matches.filter(
        (match) => match.stage_type === "group" && match.group_name === prediction.group_name
      )
    );
    const points = actual.length
      ? calculateGroupTablePoints(
          prediction.ranked_team_ids,
          actual,
          Math.min(2, actual.length),
          settingsMap.get(prediction.group_id)
        )
      : 0;

    await supabase.from("group_table_predictions").update({ points }).eq("id", prediction.id);
  }

  const { data: matchPredictions, error: matchError } = await supabase
    .from("match_predictions")
    .select("id,group_id,match_id,predicted_outcome,home_score,away_score")
    .in("group_id", groupIds);
  if (matchError) throw matchError;

  for (const prediction of matchPredictions ?? []) {
    const match = matchById.get(prediction.match_id);
    if (!match) continue;

    const settings = settingsMap.get(prediction.group_id);
    const result =
      prediction.home_score != null && prediction.away_score != null
        ? calculateExactScoreResult(
            { homeScore: prediction.home_score, awayScore: prediction.away_score },
            { status: match.status, homeScore: match.home_score, awayScore: match.away_score },
            settings
          )
        : {
            points: prediction.predicted_outcome
              ? calculateOutcomePoints(
                  prediction.predicted_outcome as MatchOutcome,
                  { status: match.status, homeScore: match.home_score, awayScore: match.away_score },
                  settings
                )
              : 0,
            exactScore: false,
            correctOutcome:
              match.status === "finished" &&
              match.home_score != null &&
              match.away_score != null &&
              prediction.predicted_outcome === outcomeForScore(match.home_score, match.away_score),
            correctGoalDifference: false
          };

    await supabase
      .from("match_predictions")
      .update({
        points: result.points,
        exact_score: result.exactScore,
        correct_outcome: result.correctOutcome,
        correct_goal_difference: result.correctGoalDifference
      })
      .eq("id", prediction.id);
  }

  const { data: knockoutPredictions, error: knockoutError } = await supabase
    .from("knockout_prediction_entries")
    .select("id,group_id,round_key,source_match_id,predicted_team_id")
    .in("group_id", groupIds);
  if (knockoutError) throw knockoutError;

  for (const prediction of knockoutPredictions ?? []) {
    const match = prediction.source_match_id ? matchById.get(prediction.source_match_id) : null;
    const points =
      match && winnerTeamId(match) === prediction.predicted_team_id
        ? knockoutPointsForRound(prediction.round_key as RoundKey, settingsMap.get(prediction.group_id))
        : 0;

    await supabase.from("knockout_prediction_entries").update({ points }).eq("id", prediction.id);
  }
}
