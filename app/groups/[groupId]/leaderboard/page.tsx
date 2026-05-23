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
  const [{ data: predictions }, { count: totalMatches }] = await Promise.all([
    supabase
      .from("predictions")
      .select("user_id,points,exact_score,correct_outcome")
      .eq("group_id", groupId),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", group.tournament_id)
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
              predictions: (predictions ?? []) as never,
              totalMatches: totalMatches ?? 0
            })}
          />
        </CardContent>
      </Card>
    </main>
  );
}
