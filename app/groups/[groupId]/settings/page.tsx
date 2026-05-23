import { leaveGroup, updateGroupSettings } from "@/app/actions/groups";
import { GroupNav } from "@/components/group-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGroupContext } from "@/lib/data";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { group, isAdmin } = await getGroupContext(groupId);

  return (
    <main className="page-shell space-y-5">
      <h1 className="text-4xl font-black">{group.name}</h1>
      <GroupNav groupId={groupId} isAdmin={Boolean(isAdmin)} />
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Group settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateGroupSettings} className="space-y-5">
              <input type="hidden" name="groupId" value={groupId} />
              <div className="space-y-2">
                <Label htmlFor="name">Group name</Label>
                <Input id="name" name="name" defaultValue={group.name} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prize mode</Label>
                  <Select name="prizeMode" defaultValue={group.prize_mode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                      <SelectItem value="buy_in">Buy-in</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" defaultValue={group.currency} maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sponsorName">Sponsor name</Label>
                  <Input id="sponsorName" name="sponsorName" defaultValue={group.sponsor_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePrizeAmount">Base prize</Label>
                  <Input id="basePrizeAmount" name="basePrizeAmount" type="number" min="0" defaultValue={group.base_prize_amount ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyInAmount">Buy-in amount</Label>
                  <Input id="buyInAmount" name="buyInAmount" type="number" min="0" defaultValue={group.buy_in_amount ?? ""} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  name="buyInRequired"
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={group.buy_in_required}
                />
                Buy-in required
              </label>
              <div className="space-y-2">
                <Label htmlFor="payoutDescription">Payout description</Label>
                <Input
                  id="payoutDescription"
                  name="payoutDescription"
                  defaultValue={group.payout_description ?? ""}
                />
              </div>
              <Button type="submit">Save settings</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <MemberSettings groupId={groupId} />
      )}
    </main>
  );
}

function MemberSettings({ groupId }: { groupId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave group</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={leaveGroup}>
          <input type="hidden" name="groupId" value={groupId} />
          <Button type="submit" variant="destructive">
            Leave group
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
