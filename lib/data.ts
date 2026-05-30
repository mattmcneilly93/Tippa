import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createInviteCode } from "@/lib/utils";

export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
});

export const getGroupContext = cache(async function getGroupContext(groupId: string) {
  const { supabase, user } = await requireUser();
  const { data: group, error } = await supabase
    .from("groups")
    .select("*,tournaments(*),group_prediction_settings(*)")
    .eq("id", groupId)
    .single();

  if (error) throw error;

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("id,user_id,display_name,role,has_paid,profiles(display_name)")
    .eq("group_id", groupId);

  if (membersError) throw membersError;
  const isAdmin = members?.some(
    (member) => member.user_id === user.id && member.role === "admin"
  );

  return {
    supabase,
    user,
    group,
    members: members ?? [],
    isAdmin
  };
});

export const getCopyableGroups = cache(async function getCopyableGroups(groupId: string) {
  const { supabase, group } = await getGroupContext(groupId);
  const { data, error } = await supabase
    .from("groups")
    .select("id,name")
    .eq("tournament_id", group.tournament_id)
    .neq("id", groupId)
    .order("name");

  if (error) throw error;
  return data ?? [];
});

export const getGroupLeaderboardPredictionData = cache(
  async function getGroupLeaderboardPredictionData(groupId: string) {
    const { supabase } = await getGroupContext(groupId);
    const [{ data: tablePredictions }, { data: matchPredictions }, { data: knockoutPredictions }] =
      await Promise.all([
        supabase.from("group_table_predictions").select("user_id,points").eq("group_id", groupId),
        supabase
          .from("match_predictions")
          .select("user_id,points,prediction_phase")
          .eq("group_id", groupId),
        supabase
          .from("knockout_prediction_entries")
          .select("user_id,points,round_key")
          .eq("group_id", groupId)
      ]);

    return {
      tablePredictions: tablePredictions ?? [],
      matchPredictions: matchPredictions ?? [],
      knockoutPredictions: knockoutPredictions ?? []
    };
  }
);

export const getPredictionPageData = cache(async function getPredictionPageData(groupId: string) {
  const { supabase, user, group } = await getGroupContext(groupId);
  const [
    { data: matches },
    { data: tablePredictions },
    { data: matchPredictions },
    { data: knockoutPredictions }
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", group.tournament_id)
      .order("round_order", { ascending: true })
      .order("kickoff_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("group_table_predictions")
      .select("group_name,ranked_team_ids,third_place_advances,points")
      .eq("group_id", groupId)
      .eq("user_id", user.id),
    supabase
      .from("match_predictions")
      .select("match_id,predicted_outcome,home_score,away_score,points")
      .eq("group_id", groupId)
      .eq("user_id", user.id),
    supabase
      .from("knockout_prediction_entries")
      .select("round_key,slot_index,source_match_id,predicted_team_id,points")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
  ]);

  return {
    matches: matches ?? [],
    tablePredictions: tablePredictions ?? [],
    matchPredictions: matchPredictions ?? [],
    knockoutPredictions: knockoutPredictions ?? []
  };
});

export const getAdminPageData = cache(async function getAdminPageData(groupId: string) {
  const { supabase, group } = await getGroupContext(groupId);
  const [{ data: matches }, { data: firstGroup }, { data: firstKnockout }] = await Promise.all([
    supabase
      .from("matches")
      .select("id,stage,home_team_name,away_team_name,kickoff_time,status,home_score,away_score")
      .eq("tournament_id", group.tournament_id)
      .order("kickoff_time", { ascending: true, nullsFirst: false })
      .limit(24),
    supabase
      .from("matches")
      .select("kickoff_time")
      .eq("tournament_id", group.tournament_id)
      .eq("stage_type", "group")
      .order("kickoff_time", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("matches")
      .select("kickoff_time")
      .eq("tournament_id", group.tournament_id)
      .eq("stage_type", "knockout")
      .neq("home_team_name", "TBD")
      .neq("away_team_name", "TBD")
      .order("round_order", { ascending: true })
      .order("kickoff_time", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    matches: matches ?? [],
    firstGroup,
    firstKnockout
  };
});

export const getDashboardData = cache(async function getDashboardData() {
  const { supabase, user } = await requireUser();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id,name,prize_mode,tournament_id,tournaments(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const cards = await Promise.all(
    (groups ?? []).map(async (group) => {
      const { data: nextMatch } = await supabase
        .from("matches")
        .select("kickoff_time")
        .eq("tournament_id", group.tournament_id)
        .gt("kickoff_time", new Date().toISOString())
        .order("kickoff_time")
        .limit(1)
        .maybeSingle();

      return {
        ...group,
        nextKickoff: nextMatch?.kickoff_time ?? null,
        rank: null
      };
    })
  );

  return { user, profile, cards };
});

export const getInvitePreview = cache(async function getInvitePreview(rawCode: string) {
  const inviteCode = createInviteCode(rawCode);
  if (inviteCode.length < 3) return null;

  const service = createServiceClient();
  const { data, error } = await service
    .from("groups")
    .select("id,name,invite_code,tournaments(name)")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export const hasJoinedGroup = cache(async function hasJoinedGroup(groupId: string, userId: string) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
});
