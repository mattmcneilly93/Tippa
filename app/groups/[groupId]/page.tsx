import { Leaderboard } from "@/components/leaderboard";
import { PrizeCard } from "@/components/prize-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupContext, getGroupLeaderboardPredictionData } from "@/lib/data";
import { buildLeaderboard } from "@/lib/leaderboard";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { group, members } = await getGroupContext(groupId);
  const { tablePredictions, matchPredictions, knockoutPredictions } =
    await getGroupLeaderboardPredictionData(groupId);

  const leaderboard = buildLeaderboard({
    members: members as never,
    tablePredictions: tablePredictions as never,
    matchPredictions: matchPredictions as never,
    knockoutPredictions: knockoutPredictions as never
  });
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <PrizeCard
          group={group}
          memberCount={members.length}
          paidCount={members.filter((member) => member.has_paid).length}
        />
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard rows={leaderboard} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
