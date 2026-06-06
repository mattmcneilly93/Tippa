import type { SupportedTournament } from "@/lib/tournaments/types";
import { openFootballWorldCup2026Adapter } from "@/lib/tournaments/adapters/openfootball-worldcup-2026";

export const supportedTournaments: SupportedTournament[] = [
  {
    code: "world-cup-2026",
    name: "FIFA World Cup 2026",
    year: 2026,
    source: "openfootball",
    isSupported: true,
    theme: {
      primary: "#002FA7",
      secondary: "#002FA7",
      accent: "#EAEEFB",
      background: "#FFFFFF",
      surface: "#FFFFFF",
      text: "#121212",
      pattern: "north-america-soft"
    }
  }
];

export const tournamentAdapters = [openFootballWorldCup2026Adapter];

export function getTournamentByCode(code: string) {
  return supportedTournaments.find((tournament) => tournament.code === code);
}

export function getAdapterByCode(code: string) {
  return tournamentAdapters.find((adapter) => adapter.tournamentCode === code);
}
