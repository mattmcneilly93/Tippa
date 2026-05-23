import { redirect } from "next/navigation";
import { saveMatchOverride, syncTournamentForGroup } from "@/app/actions/admin";
import { GroupNav } from "@/components/group-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGroupContext } from "@/lib/data";

export default async function AdminPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { supabase, group, isAdmin } = await getGroupContext(groupId);
  if (!isAdmin) redirect(`/groups/${groupId}`);

  const { data: matches } = await supabase
    .from("matches")
    .select("id,stage,home_team_name,away_team_name,kickoff_time,status,home_score,away_score")
    .eq("tournament_id", group.tournament_id)
    .order("kickoff_time", { ascending: true, nullsFirst: false })
    .limit(24);

  return (
    <main className="page-shell space-y-5">
      <h1 className="text-4xl font-black">{group.name}</h1>
      <GroupNav groupId={groupId} isAdmin />
      <Card>
        <CardHeader>
          <CardTitle>Sync tournament data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Pull the latest fixture and score data, then recalculate prediction points.
          </p>
          <form action={syncTournamentForGroup}>
            <input type="hidden" name="groupId" value={groupId} />
            <Button type="submit">Sync now</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual result override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Overrides apply only to this group. Synced tournament data stays unchanged for
            other pools.
          </p>
          {(matches ?? []).map((match) => (
            <form
              key={match.id}
              action={saveMatchOverride}
              className="grid gap-3 rounded-3xl bg-muted p-4 md:grid-cols-[1fr_10rem_5rem_5rem_auto]"
            >
              <input type="hidden" name="groupId" value={groupId} />
              <input type="hidden" name="matchId" value={match.id} />
              <div>
                <p className="font-black">
                  {match.home_team_name} vs {match.away_team_name}
                </p>
                <p className="text-xs text-muted-foreground">{match.stage}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kickoff</Label>
                <Input
                  name="kickoffTime"
                  type="datetime-local"
                  defaultValue={match.kickoff_time?.slice(0, 16) ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Home</Label>
                <Input name="homeScore" type="number" min="0" defaultValue={match.home_score ?? ""} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Away</Label>
                <Input name="awayScore" type="number" min="0" defaultValue={match.away_score ?? ""} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select name="status" defaultValue={match.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" className="mt-2 w-full">
                  Save
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
