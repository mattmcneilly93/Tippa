"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Loader2 } from "lucide-react";
import { saveGroupTablePrediction } from "@/app/actions/predictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Team = {
  id: string;
  name: string;
  flag: string;
};

type PredictionGroup = {
  groupName: string;
  teams: Team[];
  rankedTeamIds: string[] | null;
  thirdPlaceAdvances: boolean;
  points: number | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function GroupTablePredictions({
  groupId,
  locked,
  groups,
  maxThirdPlaceAdvancers,
  showPoints
}: {
  groupId: string;
  locked: boolean;
  groups: PredictionGroup[];
  maxThirdPlaceAdvancers: number;
  showPoints: boolean;
}) {
  const initialOrders = useMemo(() => {
    return Object.fromEntries(
      groups.map((group) => {
        const byId = new Map(group.teams.map((team) => [team.id, team]));
        const rankedTeams = (group.rankedTeamIds ?? [])
          .map((teamId) => byId.get(teamId))
          .filter((team): team is Team => Boolean(team));
        const unrankedTeams = group.teams.filter((team) => !rankedTeams.some((ranked) => ranked.id === team.id));

        return [group.groupName, [...rankedTeams, ...unrankedTeams]];
      })
    );
  }, [groups]);

  const pointsByGroup = useMemo(
    () => new Map(groups.map((group) => [group.groupName, group.points])),
    [groups]
  );
  const [orders, setOrders] = useState<Record<string, Team[]>>(initialOrders);
  const [thirdPlaceAdvances, setThirdPlaceAdvances] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((group) => [group.groupName, group.thirdPlaceAdvances]))
  );
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});
  const [, startTransition] = useTransition();
  const dragged = useRef<{ groupName: string; index: number } | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveVersions = useRef<Record<string, number>>({});

  function persist(groupName: string, teams: Team[], thirdAdvances = thirdPlaceAdvances[groupName] ?? false) {
    if (locked) return;
    clearTimeout(saveTimers.current[groupName]);
    setStatuses((current) => ({ ...current, [groupName]: "saving" }));

    saveTimers.current[groupName] = setTimeout(() => {
      const version = (saveVersions.current[groupName] ?? 0) + 1;
      saveVersions.current[groupName] = version;
      const formData = new FormData();
      formData.set("groupId", groupId);
      formData.set("groupName", groupName);
      formData.set("thirdPlaceAdvances", String(thirdAdvances));
      for (const team of teams) formData.append("rankedTeamIds", team.id);

      startTransition(async () => {
        try {
          await saveGroupTablePrediction(formData);
          if (saveVersions.current[groupName] !== version) return;
          setStatuses((current) => ({ ...current, [groupName]: "saved" }));
          setTimeout(() => {
            if (saveVersions.current[groupName] === version) {
              setStatuses((current) => ({ ...current, [groupName]: "idle" }));
            }
          }, 1400);
        } catch {
          if (saveVersions.current[groupName] !== version) return;
          setStatuses((current) => ({ ...current, [groupName]: "error" }));
        }
      });
    }, 500);
  }

  function reorder(groupName: string, fromIndex: number, toIndex: number) {
    if (locked || fromIndex === toIndex) return;

    setOrders((current) => {
      const next = [...current[groupName]];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persist(groupName, next);
      return { ...current, [groupName]: next };
    });
  }

  function toggleThirdPlace(groupName: string) {
    if (locked) return;
    const currentValue = thirdPlaceAdvances[groupName] ?? false;
    const selectedCount = Object.values(thirdPlaceAdvances).filter(Boolean).length;
    if (!currentValue && selectedCount >= maxThirdPlaceAdvancers) return;

    const nextValue = !currentValue;
    setThirdPlaceAdvances((current) => ({ ...current, [groupName]: nextValue }));
    persist(groupName, orders[groupName], nextValue);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => {
        const teams = orders[group.groupName] ?? group.teams;
        const status = statuses[group.groupName] ?? "idle";
        const points = pointsByGroup.get(group.groupName);
        const thirdAdvances = thirdPlaceAdvances[group.groupName] ?? false;
        const selectedThirds = Object.values(thirdPlaceAdvances).filter(Boolean).length;

        return (
          <section key={group.groupName} className="rounded-3xl border bg-background p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-black">{group.groupName}</h2>
                <p className="text-xs text-muted-foreground">Final group table</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {showPoints && points != null ? <Badge variant="outline">{points} pts</Badge> : null}
                {locked ? <Badge variant="secondary">Locked</Badge> : <StatusBadge status={status} />}
              </div>
            </div>
            {maxThirdPlaceAdvancers > 0 ? (
              <Button
                type="button"
                variant={thirdAdvances ? "default" : "outline"}
                size="sm"
                className="mb-3 w-full"
                disabled={locked || (!thirdAdvances && selectedThirds >= maxThirdPlaceAdvancers)}
                onClick={() => toggleThirdPlace(group.groupName)}
              >
                3rd place advances ({selectedThirds}/{maxThirdPlaceAdvancers})
              </Button>
            ) : null}

            <div className="space-y-2">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  draggable={!locked}
                  onDragStart={(event) => {
                    dragged.current = { groupName: group.groupName, index };
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    dragged.current = null;
                  }}
                  onDragOver={(event) => {
                    if (!locked) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const source = dragged.current;
                    dragged.current = null;
                    if (!source || source.groupName !== group.groupName) return;
                    reorder(group.groupName, source.index, index);
                  }}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-2xl border bg-card px-3 py-2 shadow-sm transition hover:border-primary/40"
                >
                  <div className="text-center text-sm font-black text-muted-foreground">{index + 1}</div>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      {team.flag}
                    </span>
                    <span className="truncate font-bold">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={locked || index === 0}
                      aria-label={`Move ${team.name} up`}
                      onClick={() => reorder(group.groupName, index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={locked || index === teams.length - 1}
                      aria-label={`Move ${team.name} down`}
                      onClick={() => reorder(group.groupName, index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <GripVertical className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <Badge variant="warm">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Saving
      </Badge>
    );
  }

  if (status === "saved") {
    return (
      <Badge variant="default">
        <Check className="mr-1 h-3 w-3" />
        Saved
      </Badge>
    );
  }

  if (status === "error") return <Badge variant="secondary">Could not save</Badge>;
  return <Badge variant="outline">Ready</Badge>;
}
