import { createGroup } from "@/app/actions/groups";
import { supportedTournaments } from "@/lib/tournaments/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewGroupPage() {
  return (
    <main className="page-shell">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="poster-pattern">
          <CardTitle className="text-3xl">Create a private pool</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Group name</Label>
                <Input id="name" name="name" placeholder="The Friday Crew Cup" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input id="inviteCode" name="inviteCode" placeholder="CREW-2026" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tournament</Label>
              <Select name="tournamentCode" defaultValue={supportedTournaments[0].code}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedTournaments
                    .filter((tournament) => tournament.isSupported)
                    .map((tournament) => (
                      <SelectItem key={tournament.code} value={tournament.code}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prize mode</Label>
                <Select name="prizeMode" defaultValue="none">
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
                <Input id="currency" name="currency" defaultValue="NOK" maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsorName">Sponsor name</Label>
                <Input id="sponsorName" name="sponsorName" placeholder="Optional sponsor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrizeAmount">Base prize</Label>
                <Input id="basePrizeAmount" name="basePrizeAmount" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyInAmount">Buy-in amount</Label>
                <Input id="buyInAmount" name="buyInAmount" type="number" min="0" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input name="buyInRequired" type="checkbox" className="h-4 w-4" />
              Buy-in required
            </label>
            <div className="space-y-2">
              <Label htmlFor="payoutDescription">Payout description</Label>
              <Input id="payoutDescription" name="payoutDescription" placeholder="Winner gets dinner bragging rights" />
            </div>
            <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
              Payments are handled outside the app.
            </p>
            <Button type="submit" size="lg" className="w-full">
              Create group
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
