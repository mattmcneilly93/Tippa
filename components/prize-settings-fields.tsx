"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type PrizeMode = "none" | "sponsored" | "buy_in" | "hybrid";

type PrizeSettingsFieldsProps = {
  defaults?: {
    prize_mode?: PrizeMode | null;
    currency?: string | null;
    sponsor_name?: string | null;
    base_prize_amount?: number | null;
    buy_in_amount?: number | null;
    buy_in_required?: boolean | null;
    payout_description?: string | null;
  };
};

export function PrizeSettingsFields({ defaults }: PrizeSettingsFieldsProps) {
  const [mode, setMode] = useState<PrizeMode>(defaults?.prize_mode ?? "none");
  const hasSponsorFields = mode === "sponsored" || mode === "hybrid";
  const hasBuyInFields = mode === "buy_in" || mode === "hybrid";
  const hasCurrency = mode !== "none";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Prize mode</Label>
          <Select name="prizeMode" value={mode} onValueChange={(value) => setMode(value as PrizeMode)}>
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

        {hasCurrency ? (
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={defaults?.currency ?? "NOK"}
              maxLength={3}
            />
          </div>
        ) : null}

        {hasSponsorFields ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="sponsorName">Sponsor name</Label>
              <Input
                id="sponsorName"
                name="sponsorName"
                defaultValue={defaults?.sponsor_name ?? ""}
                placeholder="Optional sponsor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrizeAmount">Base prize</Label>
              <Input
                id="basePrizeAmount"
                name="basePrizeAmount"
                type="number"
                min="0"
                defaultValue={defaults?.base_prize_amount ?? ""}
              />
            </div>
          </>
        ) : null}

        {hasBuyInFields ? (
          <div className="space-y-2">
            <Label htmlFor="buyInAmount">Buy-in amount</Label>
            <Input
              id="buyInAmount"
              name="buyInAmount"
              type="number"
              min="0"
              defaultValue={defaults?.buy_in_amount ?? ""}
            />
          </div>
        ) : null}
      </div>

      {mode === "hybrid" ? (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="buyInRequired"
            type="checkbox"
            className="h-4 w-4"
            defaultChecked={defaults?.buy_in_required ?? false}
          />
          Buy-in required
        </label>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="payoutDescription">Description</Label>
        <Input
          id="payoutDescription"
          name="payoutDescription"
          defaultValue={defaults?.payout_description ?? ""}
          placeholder="Optional prize note"
        />
      </div>

      {mode === "buy_in" || mode === "hybrid" ? (
        <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
          Member payments are handled outside the app.
        </p>
      ) : mode === "sponsored" ? (
        <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
          Sponsor payouts are handled outside the app.
        </p>
      ) : null}
    </div>
  );
}
