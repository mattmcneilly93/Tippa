import { isToday, isPast } from "date-fns";
import { GroupNav } from "@/components/group-nav";
import { MatchCard, type MatchCardData } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getGroupContext } from "@/lib/data";

function bucketFor(match: MatchCardData) {
  if (match.status === "finished") return "Finished";
  if (match.kickoff_time && isToday(new Date(match.kickoff_time))) return "Today";
  if (match.kickoff_time && !isPast(new Date(match.kickoff_time))) return "Upcoming";
  return match.group_name ?? match.stage;
}

export default async function PredictionsPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { supabase, user, group, isAdmin } = await getGroupContext(groupId);
  const [{ data: matches }, { data: predictions }, { data: overrides }] = await Promise.all([
    supabase
      .from("matches")
      .select("id,stage,group_name,home_team_name,away_team_name,kickoff_time,status,home_score,away_score")
      .eq("tournament_id", group.tournament_id)
      .order("kickoff_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("predictions")
      .select("match_id,home_score,away_score,points")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
    ,
    supabase
      .from("group_match_overrides")
      .select("match_id,kickoff_time,status,home_score,away_score")
      .eq("group_id", groupId)
  ]);

  const predictionByMatch = new Map(
    (predictions ?? []).map((prediction) => [prediction.match_id, prediction])
  );
  const overrideByMatch = new Map((overrides ?? []).map((override) => [override.match_id, override]));
  const hydrated = (matches ?? []).map((match) => ({
    ...match,
    ...(overrideByMatch.get(match.id)
      ? {
          kickoff_time: overrideByMatch.get(match.id)?.kickoff_time ?? match.kickoff_time,
          status: overrideByMatch.get(match.id)?.status ?? match.status,
          home_score: overrideByMatch.get(match.id)?.home_score ?? match.home_score,
          away_score: overrideByMatch.get(match.id)?.away_score ?? match.away_score
        }
      : {}),
    prediction: predictionByMatch.get(match.id) ?? null
  })) as MatchCardData[];

  const buckets = hydrated.reduce<Record<string, MatchCardData[]>>((acc, match) => {
    const key = bucketFor(match);
    acc[key] = acc[key] ?? [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <main className="page-shell space-y-5">
      <h1 className="text-4xl font-black">{group.name}</h1>
      <GroupNav groupId={groupId} isAdmin={Boolean(isAdmin)} />
      {hydrated.length ? (
        Object.entries(buckets).map(([bucket, bucketMatches]) => (
          <section key={bucket} className="space-y-3">
            <h2 className="text-2xl font-black">{bucket}</h2>
            <div className="space-y-3">
              {bucketMatches.map((match, index) => (
                <MatchCard key={match.id} match={match} groupId={groupId} index={index} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          title="No matches yet"
          description="Run the tournament sync to load World Cup 2026 fixtures."
          action={<Button disabled>Waiting for sync</Button>}
        />
      )}
    </main>
  );
}
