import { markPaid } from "@/app/actions/groups";
import { GroupNav } from "@/components/group-nav";
import { InviteCodeCard } from "@/components/invite-code-card";
import { Leaderboard } from "@/components/leaderboard";
import { PrizeCard } from "@/components/prize-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <main className="page-shell space-y-5">
      <section className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
        <Badge variant="warm">{group.tournaments?.name ?? "Tournament"}</Badge>
        <h1 className="mt-3 text-4xl font-black">{group.name}</h1>
      </section>
      <GroupNav groupId={groupId} isAdmin={Boolean(isAdmin)} />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <PrizeCard
            group={group}
            memberCount={members.length}
            paidCount={members.filter((member) => member.has_paid).length}
          />
          <InviteCodeCard code={group.invite_code} />
          <Card id="members">
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => {
                const profile = Array.isArray(member.profiles)
                  ? member.profiles[0]
                  : member.profiles;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3"
                  >
                    <div>
                      <p className="font-black">{profile?.display_name ?? "Player"}</p>
                      <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                    </div>
                    {isAdmin ? (
                      <form action={markPaid}>
                        <input type="hidden" name="groupId" value={groupId} />
                        <input type="hidden" name="memberId" value={member.id} />
                        <input
                          type="hidden"
                          name="hasPaid"
                          value={member.has_paid ? "false" : "true"}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {member.has_paid ? "Paid" : "Mark paid"}
                        </Button>
                      </form>
                    ) : (
                      <Badge variant={member.has_paid ? "warm" : "outline"}>
                        {member.has_paid ? "Paid" : "Unpaid"}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
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
