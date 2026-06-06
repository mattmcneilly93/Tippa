"use client";

import { format } from "date-fns";
import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PredictionInput } from "@/components/prediction-input";
import { motion } from "@/components/motion";

export type MatchCardData = {
  id: string;
  stage: string;
  group_name: string | null;
  home_team_name: string;
  away_team_name: string;
  kickoff_time: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_score: number | null;
  away_score: number | null;
  prediction?: {
    home_score: number;
    away_score: number;
    points: number;
  } | null;
};

export function MatchCard({
  match,
  groupId,
  index
}: {
  match: MatchCardData;
  groupId: string;
  index: number;
}) {
  const locked = match.kickoff_time ? new Date(match.kickoff_time) <= new Date() : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {match.group_name ?? match.stage}
              </p>
              <p className="text-sm text-muted-foreground">
                {match.kickoff_time
                  ? format(new Date(match.kickoff_time), "EEE MMM d, HH:mm")
                  : "Kickoff TBA"}
              </p>
            </div>
            <Badge variant={locked ? "secondary" : "warm"}>
              {locked ? (
                <>
                  <Lock className="mr-1 h-3 w-3" /> Locked
                </>
              ) : (
                "Open"
              )}
            </Badge>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <p className="text-lg font-black">{match.home_team_name}</p>
            <motion.div
              className="rounded-2xl bg-muted px-3 py-2 text-xl font-black"
              initial={false}
              animate={{ scale: match.status === "finished" ? [1, 1.08, 1] : 1 }}
            >
              {match.status === "finished"
                ? `${match.home_score ?? "-"}:${match.away_score ?? "-"}`
                : "vs"}
            </motion.div>
            <p className="text-lg font-black">{match.away_team_name}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <PredictionInput
              groupId={groupId}
              matchId={match.id}
              locked={locked}
              prediction={match.prediction}
            />
            {match.prediction ? (
              <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-2 text-sm font-black">
                <Sparkles className="h-4 w-4" />
                {match.prediction.points}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
