export type TournamentTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  pattern?: string;
};

export type SupportedTournament = {
  code: string;
  name: string;
  year: number;
  source: string;
  isSupported: boolean;
  theme: TournamentTheme;
};

export type GroupStageAdvancement = {
  directAdvancersPerGroup: number;
  bestThirdPlaceAdvancers: number;
};

export type NormalizedMatch = {
  externalId: string;
  tournamentCode: string;
  stage: string;
  groupName?: string;
  stageType: "group" | "knockout";
  roundKey:
    | "group"
    | "round_of_32"
    | "round_of_16"
    | "quarter_final"
    | "semi_final"
    | "third_place"
    | "final";
  roundOrder: number;
  homeTeamName: string;
  awayTeamName: string;
  kickoffTime: string | null;
  homeScore: number | null;
  awayScore: number | null;
  // Penalty-shootout result, when a knockout tie is decided on penalties.
  homePenalties: number | null;
  awayPenalties: number | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
};

export type NormalizedTournamentData = {
  tournamentCode: string;
  groupStageAdvancement: GroupStageAdvancement;
  matches: NormalizedMatch[];
};

export interface TournamentAdapter {
  tournamentCode: string;
  fetchTournamentData(): Promise<NormalizedTournamentData>;
}
