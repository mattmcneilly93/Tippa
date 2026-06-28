import { getGroupContext, getMemberPredictionData } from "@/lib/data";
import { flagForTeam } from "@/lib/team-flags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function isLockedAt(time: string | null | undefined) {
  return Boolean(time && new Date(time) <= new Date());
}

export default async function MemberPredictionsPage({
  params
}: {
  params: Promise<{ groupId: string; memberId: string }>;
}) {
  const { groupId, memberId } = await params;
  const { group } = await getGroupContext(groupId);

  const settings = (Array.isArray(group.group_prediction_settings)
    ? group.group_prediction_settings[0]
    : group.group_prediction_settings) as {
    group_stage_prediction_mode: string;
    knockout_prediction_mode: string;
    knockout_opened_at: string | null;
    knockout_locked_at: string | null;
  } | null;

  // Only show other members' predictions after group stage is locked
  const { matches, tablePredictions, matchPredictions, knockoutPredictions, displayName } =
    await getMemberPredictionData(groupId, memberId);

  const allMatches = matches as {
    id: string;
    stage_type: string;
    group_name: string | null;
    round_key: string;
    home_team_name: string;
    away_team_name: string;
    home_team_id: string | null;
    away_team_id: string | null;
    kickoff_time: string | null;
  }[];

  const firstGroupKickoff = allMatches.find(
    (m) => m.stage_type === "group" && m.kickoff_time
  )?.kickoff_time ?? null;
  const groupLocked = isLockedAt(firstGroupKickoff);
  const knockoutLocked = isLockedAt(settings?.knockout_locked_at);

  const groupMatches = allMatches.filter((m) => m.stage_type === "group");
  const knockoutMatches = allMatches.filter((m) => m.stage_type === "knockout");

  const tablePredictionByGroup = new Map(
    tablePredictions.map((p) => [p.group_name, p])
  );
  const matchPredictionByMatch = new Map(
    matchPredictions.map((p) => [p.match_id, p])
  );
  const knockoutPredictionByMatch = new Map(
    knockoutPredictions
      .filter((p) => p.source_match_id)
      .map((p) => [p.source_match_id, p])
  );

  // Build team lists per group
  const teamsByGroup = new Map<string, { id: string; name: string; flag: string }[]>();
  for (const match of groupMatches) {
    const groupName = match.group_name ?? "Group";
    const list = teamsByGroup.get(groupName) ?? [];
    for (const [id, name] of [
      [match.home_team_id, match.home_team_name],
      [match.away_team_id, match.away_team_name]
    ] as [string | null, string][]) {
      if (id && !list.some((t) => t.id === id)) {
        list.push({ id, name, flag: flagForTeam(name) });
      }
    }
    teamsByGroup.set(groupName, list);
  }

  const sortedGroups = [...teamsByGroup.keys()].sort(new Intl.Collator(undefined, { numeric: true }).compare.bind(new Intl.Collator()));

  return (
    <>
      <div className="flex items-center gap-3 pb-2">
        <h2 className="text-2xl font-black">{displayName}&apos;s predictions</h2>
        <Badge variant="secondary">Read-only</Badge>
      </div>

      {/* Predictions stay hidden until each phase locks, so nobody can copy. */}
      {!groupLocked && (
        <Card>
          <CardHeader><CardTitle>Group stage predictions</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hidden until the group stage locks at the first kickoff.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Group stage table predictions */}
      {groupLocked && settings?.group_stage_prediction_mode === "table" && (
        <Card>
          <CardHeader><CardTitle>Group stage rankings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sortedGroups.map((groupName) => {
              const teams = teamsByGroup.get(groupName) ?? [];
              const prediction = tablePredictionByGroup.get(groupName);
              const ranked = prediction?.ranked_team_ids
                ? prediction.ranked_team_ids
                    .map((id: string) => teams.find((t) => t.id === id))
                    .filter(Boolean)
                : null;

              return (
                <div key={groupName} className="rounded-3xl bg-muted p-4">
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">{groupName}</p>
                  {ranked ? (
                    <ol className="space-y-1">
                      {ranked.map((team: { id: string; name: string; flag: string } | undefined, i: number) =>
                        team ? (
                          <li key={team.id} className="flex items-center gap-2 text-sm font-semibold">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{team.flag}</span>
                            <span>{team.name}</span>
                          </li>
                        ) : null
                      )}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No prediction submitted</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Match outcome / exact score predictions */}
      {groupLocked &&
        (settings?.group_stage_prediction_mode === "match_outcome" ||
          settings?.group_stage_prediction_mode === "exact_score") && (
        <Card>
          <CardHeader><CardTitle>Group stage predictions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {groupMatches.map((match) => {
              const p = matchPredictionByMatch.get(match.id);
              return (
                <div key={match.id} className="flex items-center justify-between rounded-3xl bg-muted p-4">
                  <div>
                    <p className="font-black">{match.home_team_name} vs {match.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">{match.group_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p ? (
                      settings.group_stage_prediction_mode === "exact_score" ? (
                        <span className="font-black">{p.home_score ?? "?"} – {p.away_score ?? "?"}</span>
                      ) : (
                        <Badge variant="outline">
                          {p.predicted_outcome === "home" ? match.home_team_name : p.predicted_outcome === "away" ? match.away_team_name : "Draw"}
                        </Badge>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                    {p ? <Badge variant="outline">{p.points} pts</Badge> : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Knockout predictions hidden until the knockout phase locks. */}
      {settings?.knockout_opened_at && !knockoutLocked && (
        <Card>
          <CardHeader><CardTitle>Knockout predictions</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hidden until knockout predictions lock.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Knockout predictions */}
      {knockoutLocked && knockoutMatches.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Knockout predictions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {knockoutMatches.map((match) => {
              const p = knockoutPredictionByMatch.get(match.id);
              const teams = [
                match.home_team_id ? { id: match.home_team_id, name: match.home_team_name } : null,
                match.away_team_id ? { id: match.away_team_id, name: match.away_team_name } : null,
              ].filter(Boolean);
              const pickedTeam = teams.find((t) => t?.id === p?.predicted_team_id);
              return (
                <div key={match.id} className="flex items-center justify-between rounded-3xl bg-muted p-4">
                  <div>
                    <p className="font-black">{match.home_team_name} vs {match.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">{match.stage_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pickedTeam ? (
                      <Badge variant="outline">{pickedTeam.name}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                    {p ? <Badge variant="outline">{p.points} pts</Badge> : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}
