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

export type NormalizedMatch = {
  externalId: string;
  tournamentCode: string;
  stage: string;
  groupName?: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffTime: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished" | "postponed";
};

export type NormalizedTournamentData = {
  tournamentCode: string;
  matches: NormalizedMatch[];
};

export interface TournamentAdapter {
  tournamentCode: string;
  fetchTournamentData(): Promise<NormalizedTournamentData>;
}
