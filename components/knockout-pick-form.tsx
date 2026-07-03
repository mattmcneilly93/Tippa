"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type Team = { id: string; name: string };
type Status = "idle" | "saving" | "saved" | "error";

// Submits knockout winner picks by calling the server action directly inside a
// transition, so a failed save shows "Couldn't save" instead of throwing and
// crashing the page. Used for both the player picker and the admin editor.
export function KnockoutPickForm({
  action,
  hiddenFields,
  teams,
  defaultTeamId,
  locked = false,
  points
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  teams: Team[];
  defaultTeamId?: string;
  locked?: boolean;
  points?: number | null;
}) {
  const [teamId, setTeamId] = useState<string | undefined>(defaultTeamId);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!teamId || locked) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(hiddenFields)) formData.set(key, value);
    formData.set("predictedTeamId", teamId);

    startTransition(async () => {
      try {
        await action(formData);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } catch {
        setStatus("error");
      }
    });
  }

  if (!teams.length) {
    return <span className="text-sm text-muted-foreground">Teams not decided yet</span>;
  }

  const buttonVariant =
    status === "saved" ? "success" : status === "error" ? "destructive" : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center justify-end gap-2">
      {points != null ? <Badge variant="outline">{points} pts</Badge> : null}
      <Select
        value={teamId}
        onValueChange={(value) => {
          setTeamId(value);
          if (status === "error") setStatus("idle");
        }}
        disabled={locked || isPending}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Pick winner" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={locked || isPending || !teamId} variant={buttonVariant}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "saved" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Trophy className="h-4 w-4" />
        )}
        {isPending ? "Saving..." : status === "saved" ? "Saved" : status === "error" ? "Couldn't save" : "Save"}
      </Button>
    </form>
  );
}
