import { scoringPresets, type ScoreSettings } from "@/lib/scoring";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScoringDefaults = Partial<{
  table_exact_position_points: number;
  table_advancing_status_points: number;
  table_group_winner_bonus: number;
  match_outcome_points: number;
  exact_score_points: number;
  correct_goal_difference_points: number;
  correct_outcome_points: number;
  knockout_round_of_32_points: number;
  knockout_round_of_16_points: number;
  knockout_quarter_final_points: number;
  knockout_semi_final_points: number;
  knockout_champion_points: number;
  knockout_third_place_points: number;
}>;

const fields: Array<[keyof ScoreSettings, keyof ScoringDefaults, string]> = [
  ["tableExactPositionPoints", "table_exact_position_points", "Table exact position"],
  ["tableAdvancingStatusPoints", "table_advancing_status_points", "Table advancing status"],
  ["tableGroupWinnerBonus", "table_group_winner_bonus", "Group winner bonus"],
  ["matchOutcomePoints", "match_outcome_points", "Match winner"],
  ["exactScorePoints", "exact_score_points", "Exact score"],
  ["correctGoalDifferencePoints", "correct_goal_difference_points", "Correct goal difference"],
  ["correctOutcomePoints", "correct_outcome_points", "Correct outcome"],
  ["knockoutRoundOf32Points", "knockout_round_of_32_points", "Round of 32 winner"],
  ["knockoutRoundOf16Points", "knockout_round_of_16_points", "Round of 16 winner"],
  ["knockoutQuarterFinalPoints", "knockout_quarter_final_points", "Quarterfinal winner"],
  ["knockoutSemiFinalPoints", "knockout_semi_final_points", "Semifinal winner"],
  ["knockoutChampionPoints", "knockout_champion_points", "Champion"],
  ["knockoutThirdPlacePoints", "knockout_third_place_points", "Third-place winner"]
];

export function ScoringSettingsFields({ defaults }: { defaults?: ScoringDefaults | null }) {
  return (
    <details className="rounded-3xl border bg-background p-4 md:col-span-2">
      <summary className="cursor-pointer text-sm font-black">Advanced custom scoring</summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map(([name, rowKey, label]) => (
          <div key={name} className="space-y-1">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type="number"
              min="0"
              defaultValue={defaults?.[rowKey] ?? scoringPresets.balanced[name]}
            />
          </div>
        ))}
      </div>
    </details>
  );
}
