import { GroupNav } from "@/components/group-nav";
import { Leaderboard } from "@/components/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupContext } from "@/lib/data";
import { buildLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { supabase, group, members, isAdmin } = await getGroupContext(groupId);
  const [{ data: tablePredictions }, { data: matchPredictions }, { data: knockoutPredictions }] =
    await Promise.all([
      supabase.from("group_table_predictions").select("user_id,points").eq("group_id", groupId),
      supabase.from("match_predictions").select("user_id,points,prediction_phase").eq("group_id", groupId),
      supabase
        .from("knockout_prediction_entries")
        .select("user_id,points,round_key")
        .eq("group_id", groupId)
  ]);

  return (
    <main className="page-shell space-y-5">
      <h1 className="text-4xl font-black">{group.name}</h1>
      <GroupNav groupId={groupId} isAdmin={Boolean(isAdmin)} />
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard
            rows={buildLeaderboard({
              members: members as never,
              tablePredictions: (tablePredictions ?? []) as never,
              matchPredictions: (matchPredictions ?? []) as never,
              knockoutPredictions: (knockoutPredictions ?? []) as never
            })}
          />
        </CardContent>
      </Card>
    </main>
  );
}
