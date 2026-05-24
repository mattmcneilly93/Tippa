import { GroupNav } from "@/components/group-nav";
import { GroupOverviewActions } from "@/components/group-overview-actions";
import { Leaderboard } from "@/components/leaderboard";
import { PrizeCard } from "@/components/prize-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupContext } from "@/lib/data";
import { buildLeaderboard } from "@/lib/leaderboard";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
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

  const leaderboard = buildLeaderboard({
    members: members as never,
    tablePredictions: (tablePredictions ?? []) as never,
    matchPredictions: (matchPredictions ?? []) as never,
    knockoutPredictions: (knockoutPredictions ?? []) as never
  });
  const tracksBuyIns = group.prize_mode === "buy_in" || group.prize_mode === "hybrid";

  return (
    <main className="page-shell space-y-5">
      <section className="flex flex-col gap-5 rounded-[2rem] bg-primary p-6 text-primary-foreground md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="warm">{group.tournaments?.name ?? "Tournament"}</Badge>
          <h1 className="mt-3 text-4xl font-black">{group.name}</h1>
        </div>
        <GroupOverviewActions
          groupId={groupId}
          inviteCode={group.invite_code}
          isAdmin={Boolean(isAdmin)}
          tracksBuyIns={tracksBuyIns}
          members={members}
        />
      </section>
      <GroupNav groupId={groupId} isAdmin={Boolean(isAdmin)} />
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
    </main>
  );
}
