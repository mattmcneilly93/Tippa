import type { LeaderboardRow } from "@/components/leaderboard";

type Member = {
  user_id: string;
  display_name?: string | null;
  profiles: { display_name: string } | { display_name: string }[] | null;
};

type PointRow = {
  user_id: string;
  points: number;
};

type MatchPointRow = PointRow & {
  prediction_phase?: "group" | "knockout";
};

type KnockoutPointRow = PointRow & {
  round_key: string;
};

function displayName(profile: Member["profiles"]) {
  if (Array.isArray(profile)) return profile[0]?.display_name ?? "Player";
  return profile?.display_name ?? "Player";
}

function sumPoints(rows: PointRow[], userId: string) {
  return rows
    .filter((row) => row.user_id === userId)
    .reduce((sum, row) => sum + (row.points ?? 0), 0);
}

export function buildLeaderboard({
  members,
  tablePredictions,
  matchPredictions,
  knockoutPredictions
}: {
  members: Member[];
  tablePredictions: PointRow[];
  matchPredictions: MatchPointRow[];
  knockoutPredictions: KnockoutPointRow[];
}): LeaderboardRow[] {
  return members
    .map((member) => {
      const groupStagePoints =
        sumPoints(tablePredictions, member.user_id) +
        sumPoints(
          matchPredictions.filter((prediction) => prediction.prediction_phase !== "knockout"),
          member.user_id
        );
      const knockoutPoints =
        sumPoints(knockoutPredictions, member.user_id) +
        sumPoints(
          matchPredictions.filter((prediction) => prediction.prediction_phase === "knockout"),
          member.user_id
        );
      const championCorrect = knockoutPredictions.filter(
        (prediction) =>
          prediction.user_id === member.user_id &&
          prediction.round_key === "final" &&
          prediction.points > 0
      ).length;

      return {
        userId: member.user_id,
        displayName: member.display_name?.trim() || displayName(member.profiles),
        groupStagePoints,
        knockoutPoints,
        championCorrect,
        points: groupStagePoints + knockoutPoints
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.knockoutPoints - a.knockoutPoints ||
        b.championCorrect - a.championCorrect ||
        a.displayName.localeCompare(b.displayName)
    );
}
