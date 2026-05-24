import { CopyPredictionsForm } from "@/components/copy-predictions-form";
import { GroupOverviewActions } from "@/components/group-overview-actions";
import { GroupRouteFrame } from "@/components/group-route-frame";
import { getCopyableGroups, getGroupContext } from "@/lib/data";

export default async function GroupLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { group, members, isAdmin } = await getGroupContext(groupId);
  const tournament = Array.isArray(group.tournaments) ? group.tournaments[0] : group.tournaments;
  const tracksBuyIns = group.prize_mode === "buy_in" || group.prize_mode === "hybrid";
  const copyableGroups = await getCopyableGroups(groupId);

  return (
    <main className="page-shell space-y-5">
      <div className="space-y-1">
        <h1 className="text-4xl font-black">{group.name}</h1>
        <p className="text-sm text-muted-foreground">{tournament?.name ?? "Tournament"}</p>
      </div>
      <GroupRouteFrame
        groupId={groupId}
        isAdmin={Boolean(isAdmin)}
        overviewActions={
          <GroupOverviewActions
            groupId={groupId}
            inviteCode={group.invite_code}
            isAdmin={Boolean(isAdmin)}
            tracksBuyIns={tracksBuyIns}
            members={members}
          />
        }
        predictionActions={
          copyableGroups?.length ? (
            <CopyPredictionsForm targetGroupId={groupId} copyableGroups={copyableGroups} />
          ) : null
        }
      >
        {children}
      </GroupRouteFrame>
    </main>
  );
}
