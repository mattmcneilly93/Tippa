import type { LeaderboardRow } from "@/components/leaderboard";

type Member = {
  user_id: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
};

type Prediction = {
  user_id: string;
  points: number;
  exact_score: boolean;
  correct_outcome: boolean;
};

function displayName(profile: Member["profiles"]) {
  if (Array.isArray(profile)) return profile[0]?.display_name ?? "Player";
  return profile?.display_name ?? "Player";
}

export function buildLeaderboard({
  members,
  predictions,
  totalMatches
}: {
  members: Member[];
  predictions: Prediction[];
  totalMatches: number;
}): LeaderboardRow[] {
  return members
    .map((member) => {
      const userPredictions = predictions.filter(
        (prediction) => prediction.user_id === member.user_id
      );
      return {
        userId: member.user_id,
        displayName: displayName(member.profiles),
        points: userPredictions.reduce((sum, prediction) => sum + prediction.points, 0),
        exactScores: userPredictions.filter((prediction) => prediction.exact_score).length,
        correctOutcomes: userPredictions.filter((prediction) => prediction.correct_outcome).length,
        remainingPredictions: Math.max(totalMatches - userPredictions.length, 0)
      };
    })
    .sort((a, b) => b.points - a.points || b.exactScores - a.exactScores);
}
