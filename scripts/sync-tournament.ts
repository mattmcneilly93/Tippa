import { syncSupportedTournaments, syncTournament } from "@/lib/tournaments/sync";

async function main() {
  const tournamentCode = process.argv[2];
  const result = tournamentCode
    ? await syncTournament(tournamentCode)
    : await syncSupportedTournaments();

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
