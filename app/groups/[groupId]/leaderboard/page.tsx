import { Leaderboard } from "@/components/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupContext, getGroupLeaderboardPredictionData } from "@/lib/data";
import { buildLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { members } = await getGroupContext(groupId);
  const { tablePredictions, matchPredictions, knockoutPredictions } =
    await getGroupLeaderboardPredictionData(groupId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard
            rows={buildLeaderboard({
              members: members as never,
              tablePredictions: tablePredictions as never,
              matchPredictions: matchPredictions as never,
              knockoutPredictions: knockoutPredictions as never
            })}
          />
        </CardContent>
      </Card>
    </>
  );
}
