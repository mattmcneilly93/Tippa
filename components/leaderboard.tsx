"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "@/components/motion";

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  points: number;
  groupStagePoints: number;
  knockoutPoints: number;
  championCorrect: number;
};

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <motion.div layout key={row.userId} transition={{ type: "spring", stiffness: 420, damping: 34 }}>
          <Card className={index === 0 ? "border-primary bg-accent" : ""}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black">
                {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{row.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  Group {row.groupStagePoints} · Knockout {row.knockoutPoints}
                </p>
              </div>
              <p className="text-2xl font-black">{row.points}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
