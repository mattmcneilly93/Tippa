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
      primary: "#101827",
      secondary: "#E63946",
      accent: "#F7C948",
      background: "#F7F3EA",
      surface: "#FFFFFF",
      text: "#101827",
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
