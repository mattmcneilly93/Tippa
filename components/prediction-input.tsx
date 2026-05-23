"use client";

import { Lock, Save } from "lucide-react";
import { savePrediction } from "@/app/actions/predictions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "@/components/motion";

export function PredictionInput({
  groupId,
  matchId,
  locked,
  prediction
}: {
  groupId: string;
  matchId: string;
  locked: boolean;
  prediction?: { home_score: number; away_score: number } | null;
}) {
  return (
    <motion.form
      action={savePrediction}
      className="flex items-center gap-2"
      animate={{ opacity: locked ? 0.65 : 1 }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Input
        name="homeScore"
        type="number"
        min="0"
        className="h-12 w-16 text-center text-lg font-black"
        defaultValue={prediction?.home_score ?? ""}
        disabled={locked}
        aria-label="Home score prediction"
      />
      <span className="font-black">-</span>
      <Input
        name="awayScore"
        type="number"
        min="0"
        className="h-12 w-16 text-center text-lg font-black"
        defaultValue={prediction?.away_score ?? ""}
        disabled={locked}
        aria-label="Away score prediction"
      />
      <Button type="submit" size="icon" disabled={locked} aria-label="Save prediction">
        {locked ? <Lock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      </Button>
    </motion.form>
  );
}
