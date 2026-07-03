import {
  getGroupContext,
  getMemberKnockoutPredictionsForAdmin,
  getMemberPredictionData
} from "@/lib/data";
import { adminSaveKnockoutPrediction } from "@/app/actions/admin";
import { KnockoutPickForm } from "@/components/knockout-pick-form";
import { flagForTeam } from "@/lib/team-flags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateFormat, isKnockoutMatchLocked, knockoutLockTime } from "@/lib/utils";

function isLockedAt(time: string | null | undefined) {
  return Boolean(time && new Date(time) <= new Date());
}

export default async function MemberPredictionsPage({
  params
}: {
  params: Promise<{ groupId: string; memberId: string }>;
}) {
  const { groupId, memberId } = await params;
  const { group, isAdmin } = await getGroupContext(groupId);

  const settings = (Array.isArray(group.group_prediction_settings)
    ? group.group_prediction_settings[0]
    : group.group_prediction_settings) as {
    group_stage_prediction_mode: string;
    knockout_prediction_mode: string;
    include_third_place: boolean;
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

  // Admins can edit knockout picks anytime; prefill with the member's current
  // picks read via the service client (works even before the global lock).
  const adminKnockoutPredictions = isAdmin
    ? await getMemberKnockoutPredictionsForAdmin(groupId, memberId)
    : [];
  const adminKnockoutByMatch = new Map(
    adminKnockoutPredictions
      .filter((p) => p.source_match_id)
      .map((p) => [p.source_match_id, p])
  );
  const includeThirdPlace = settings?.include_third_place ?? false;
  const editableKnockoutMatches = includeThirdPlace
    ? knockoutMatches
    : knockoutMatches.filter((m) => m.round_key !== "third_place");

  // Points breakdown — where each person's total came from.
  const groupStagePoints =
    tablePredictions.reduce((sum, p) => sum + (p.points ?? 0), 0) +
    groupMatches.reduce((sum, m) => sum + (matchPredictionByMatch.get(m.id)?.points ?? 0), 0);
  const knockoutPoints =
    knockoutPredictions.reduce((sum, p) => sum + (p.points ?? 0), 0) +
    knockoutMatches.reduce((sum, m) => sum + (matchPredictionByMatch.get(m.id)?.points ?? 0), 0);
  const totalPoints = groupStagePoints + knockoutPoints;

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

      <Card>
        <CardHeader><CardTitle>Points breakdown</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-3xl font-black">{totalPoints}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Group stage</p>
            <p className="text-2xl font-black">{groupStagePoints}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Knockout</p>
            <p className="text-2xl font-black">{knockoutPoints}</p>
          </div>
        </CardContent>
      </Card>

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
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">{groupName}</p>
                    {prediction ? (
                      <Badge variant="outline">{prediction.points ?? 0} pts</Badge>
                    ) : null}
                  </div>
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

      {/* Admin override editor — set or fix this member's knockout picks anytime. */}
      {isAdmin && settings?.knockout_opened_at && editableKnockoutMatches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Edit knockout picks</CardTitle>
              <Badge variant="warm">Admin</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can set or correct {displayName}&apos;s picks here at any time — before or
              after a match. Scores recalculate automatically.
            </p>
            {editableKnockoutMatches.map((match, index) => {
              const current = adminKnockoutByMatch.get(match.id);
              const locked = isKnockoutMatchLocked(match.kickoff_time);
              const hasTeams = Boolean(match.home_team_id || match.away_team_id);
              const teams = [
                match.home_team_id ? { id: match.home_team_id, name: match.home_team_name } : null,
                match.away_team_id ? { id: match.away_team_id, name: match.away_team_name } : null
              ].filter((team): team is { id: string; name: string } => Boolean(team));
              return (
                <div
                  key={match.id}
                  className="grid gap-3 rounded-3xl bg-muted p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-black">{match.home_team_name} vs {match.away_team_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {match.stage_type}
                      {locked ? " · Match locked (admin override)" : ""}
                    </p>
                  </div>
                  <KnockoutPickForm
                    action={adminSaveKnockoutPrediction}
                    hiddenFields={{
                      groupId,
                      targetUserId: memberId,
                      roundKey: match.round_key,
                      slotIndex: String(index),
                      sourceMatchId: match.id
                    }}
                    teams={hasTeams ? teams : []}
                    defaultTeamId={current?.predicted_team_id ?? undefined}
                    points={current?.points}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Knockout predictions — each pick is revealed once that match locks. */}
      {!isAdmin && settings?.knockout_opened_at && knockoutMatches.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Knockout predictions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {knockoutMatches.map((match) => {
              const matchLocked = isKnockoutMatchLocked(match.kickoff_time);
              const lockTime = knockoutLockTime(match.kickoff_time);
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
                    <p className="text-xs text-muted-foreground">
                      {matchLocked
                        ? match.stage_type
                        : lockTime
                          ? `Hidden until ${dateFormat.format(lockTime)}`
                          : "Hidden until lock"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {matchLocked ? (
                      <>
                        {pickedTeam ? (
                          <Badge variant="outline">{pickedTeam.name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                        {p ? <Badge variant="outline">{p.points} pts</Badge> : null}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">🔒 Hidden</span>
                    )}
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
