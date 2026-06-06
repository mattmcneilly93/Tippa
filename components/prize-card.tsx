import { Gift, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PrizeGroup = {
  prize_mode: "none" | "sponsored" | "buy_in" | "hybrid";
  currency: string;
  sponsor_name: string | null;
  base_prize_amount: number | null;
  buy_in_amount: number | null;
  buy_in_required: boolean;
  payout_description: string | null;
};

export function PrizeCard({
  group,
  memberCount,
  paidCount
}: {
  group: PrizeGroup;
  memberCount?: number;
  paidCount?: number;
}) {
  const tracksBuyIns = group.prize_mode === "buy_in" || group.prize_mode === "hybrid";
  const hasBasePrize = group.prize_mode === "sponsored" || group.prize_mode === "hybrid";
  const buyInPool = (group.buy_in_amount ?? 0) * (paidCount ?? 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Prize</CardTitle>
          {tracksBuyIns ? (
            <Badge variant="warm">Outside payments</Badge>
          ) : group.prize_mode === "none" ? (
            <Badge variant="outline">No money prize</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tippa-accent)] text-primary">
            {group.prize_mode === "none" ? (
              <Gift className="h-5 w-5" />
            ) : (
              <WalletCards className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="font-bold">
              {group.prize_mode === "none" && "No money prize set"}
              {group.prize_mode === "sponsored" &&
                `Sponsored by ${group.sponsor_name || "someone generous"}`}
              {group.prize_mode === "buy_in" &&
                `${formatCurrency(group.buy_in_amount, group.currency)} buy-in`}
              {group.prize_mode === "hybrid" &&
                `${formatCurrency(group.base_prize_amount, group.currency)} + buy-in pool`}
            </p>
            {group.prize_mode === "none" ? (
              <p className="text-sm text-muted-foreground">
                Just for bragging rights.
              </p>
            ) : tracksBuyIns ? (
              <p className="text-sm text-muted-foreground">
                Buy-in payments are tracked here, but handled outside the app.
              </p>
            ) : group.prize_mode === "sponsored" ? (
              <p className="text-sm text-muted-foreground">
                The prize is provided by the sponsor.
              </p>
            ) : null}
          </div>
        </div>
        {group.prize_mode !== "none" ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {hasBasePrize ? (
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-muted-foreground">Base</p>
                <p className="font-black">
                  {formatCurrency(group.base_prize_amount ?? 0, group.currency)}
                </p>
              </div>
            ) : null}
            {tracksBuyIns ? (
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-muted-foreground">Buy-in pool</p>
                <p className="font-black">{formatCurrency(buyInPool, group.currency)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        {tracksBuyIns && memberCount != null && paidCount != null ? (
          <p className="text-sm text-muted-foreground">
            {paidCount} of {memberCount} marked paid.
          </p>
        ) : null}
        {group.payout_description ? (
          <p className="rounded-2xl bg-accent p-3 text-sm">{group.payout_description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
