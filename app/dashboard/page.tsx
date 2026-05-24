import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardActions } from "@/components/dashboard-actions";
import { GroupCard } from "@/components/group-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { user, profile, cards } = await getDashboardData();

  return (
    <main className="page-shell space-y-6">
      <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black">Your groups</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <DashboardActions
            defaultDisplayName={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
          />
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="h-4 w-4" /> New group
            </Link>
          </Button>
        </div>
      </section>

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
