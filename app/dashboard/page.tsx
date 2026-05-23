import Link from "next/link";
import { Plus } from "lucide-react";
import { joinGroup } from "@/app/actions/groups";
import { updateProfile } from "@/app/actions/profile";
import { GroupCard } from "@/components/group-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/data";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id,name,prize_mode,tournament_id,tournaments(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const cards = await Promise.all(
    (groups ?? []).map(async (group) => {
      const { data: nextMatch } = await supabase
        .from("matches")
        .select("kickoff_time")
        .eq("tournament_id", group.tournament_id)
        .gt("kickoff_time", new Date().toISOString())
        .order("kickoff_time")
        .limit(1)
        .maybeSingle();

      return {
        ...group,
        nextKickoff: nextMatch?.kickoff_time ?? null,
        rank: null
      };
    })
  );

  return (
    <main className="page-shell space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-primary p-6 text-primary-foreground md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-bold text-[#F7C948]">Welcome back</p>
          <h1 className="text-4xl font-black">Your pools</h1>
          <p className="text-primary-foreground/70">{user.email}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/groups/new">
            <Plus className="h-4 w-4" /> New group
          </Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Join with code</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={joinGroup} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="inviteCode">Invite code</Label>
              <Input id="inviteCode" name="inviteCode" placeholder="CREW-2026" required />
            </div>
            <Button className="self-end" type="submit">
              Join
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="displayName">Name shown in leaderboards</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
                required
              />
            </div>
            <Button className="self-end" type="submit" variant="outline">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {cards.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          description="Create a private pool or join one with an invite code."
          action={
            <Button asChild>
              <Link href="/groups/new">Create a pool</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
