import { leaveGroup, updateGroupSettings } from "@/app/actions/groups";
import { GroupNav } from "@/components/group-nav";
import { ScoringSettingsFields } from "@/components/scoring-settings-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { getGroupContext } from "@/lib/data";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { group, isAdmin } = await getGroupContext(groupId);
  const predictionSettings = Array.isArray(group.group_prediction_settings)
    ? group.group_prediction_settings[0]
    : group.group_prediction_settings;

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
              <div className="grid gap-4 rounded-3xl bg-muted p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Group-stage predictions</Label>
                  <Select
                    name="groupStagePredictionMode"
                    defaultValue={predictionSettings?.group_stage_prediction_mode ?? "table"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Rank each group table</SelectItem>
                      <SelectItem value="match_outcome">Pick match winners</SelectItem>
                      <SelectItem value="exact_score">Predict exact scores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scoring preset</Label>
                  <Select
                    name="scoringPreset"
                    defaultValue={predictionSettings?.scoring_preset ?? "balanced"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high_stakes">High stakes</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Knockout predictions</Label>
                  <Select
                    name="knockoutPredictionMode"
                    defaultValue={predictionSettings?.knockout_prediction_mode ?? "winner_bracket"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winner_bracket">Pick bracket winners</SelectItem>
                      <SelectItem value="exact_score">Predict knockout scores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                  <input
                    name="includeThirdPlace"
                    type="checkbox"
                    className="h-4 w-4"
                    defaultChecked={predictionSettings?.include_third_place ?? false}
                  />
                  Include third-place match in knockout predictions
                </label>
                <ScoringSettingsFields defaults={predictionSettings} />
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
              <SubmitButton idleText="Save settings" />
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
