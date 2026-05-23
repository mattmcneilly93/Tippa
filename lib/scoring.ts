export type PredictionScoreInput = {
  homeScore: number;
  awayScore: number;
};

export type MatchScoreInput = {
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  homeScore: number | null;
  awayScore: number | null;
};

export type ScoreSettings = {
  exactScorePoints: number;
  correctGoalDifferencePoints: number;
  correctOutcomePoints: number;
};

export const defaultScoreSettings: ScoreSettings = {
  exactScorePoints: 3,
  correctGoalDifferencePoints: 2,
  correctOutcomePoints: 1
};

export function calculatePredictionResult(
  prediction: PredictionScoreInput,
  match: MatchScoreInput,
  settings: ScoreSettings = defaultScoreSettings
) {
  if (match.status !== "finished") {
    return {
      points: 0,
      exactScore: false,
      correctOutcome: false,
      correctGoalDifference: false
    };
  }

  if (match.homeScore == null || match.awayScore == null) {
    return {
      points: 0,
      exactScore: false,
      correctOutcome: false,
      correctGoalDifference: false
    };
  }

  const exactScore =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;
  const actualDiff = match.homeScore - match.awayScore;
  const predictedDiff = prediction.homeScore - prediction.awayScore;
  const actualOutcome = Math.sign(actualDiff);
  const predictedOutcome = Math.sign(predictedDiff);
  const correctOutcome = actualOutcome === predictedOutcome;
  const correctGoalDifference = correctOutcome && actualDiff === predictedDiff;

  if (exactScore) {
    return {
      points: settings.exactScorePoints,
      exactScore,
      correctOutcome,
      correctGoalDifference
    };
  }

  if (correctGoalDifference) {
    return {
      points: settings.correctGoalDifferencePoints,
      exactScore,
      correctOutcome,
      correctGoalDifference
    };
  }

  if (correctOutcome) {
    return {
      points: settings.correctOutcomePoints,
      exactScore,
      correctOutcome,
      correctGoalDifference
    };
  }

  return {
    points: 0,
    exactScore,
    correctOutcome,
    correctGoalDifference
  };
}

export function calculatePredictionPoints(
  prediction: PredictionScoreInput,
  match: MatchScoreInput,
  settings: ScoreSettings = defaultScoreSettings
) {
  return calculatePredictionResult(prediction, match, settings).points;
}
