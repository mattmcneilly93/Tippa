"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createInviteCode } from "@/lib/utils";

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  tournamentCode: z.string().min(1),
  inviteCode: z.string().trim().min(3).max(24),
  prizeMode: z.enum(["none", "sponsored", "buy_in", "hybrid"]),
  currency: z.string().trim().min(3).max(3).default("NOK"),
  sponsorName: z.string().trim().max(60).optional(),
  basePrizeAmount: z.coerce.number().min(0).optional(),
  buyInAmount: z.coerce.number().min(0).optional(),
  buyInRequired: z.coerce.boolean().optional(),
  payoutDescription: z.string().trim().max(240).optional()
});

export async function createGroup(formData: FormData) {
  const parsed = createGroupSchema.parse({
    name: formData.get("name"),
    tournamentCode: formData.get("tournamentCode"),
    inviteCode: formData.get("inviteCode"),
    prizeMode: formData.get("prizeMode"),
    currency: formData.get("currency") || "NOK",
    sponsorName: formData.get("sponsorName") || undefined,
    basePrizeAmount: formData.get("basePrizeAmount") || undefined,
    buyInAmount: formData.get("buyInAmount") || undefined,
    buyInRequired: formData.get("buyInRequired") === "on",
    payoutDescription: formData.get("payoutDescription") || undefined
  });

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureProfile(user.id, user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Player");

  const service = createServiceClient();
  const { data: tournament, error: tournamentError } = await service
    .from("tournaments")
    .select("id")
    .eq("code", parsed.tournamentCode)
    .eq("is_supported", true)
    .single();

  if (tournamentError) throw tournamentError;

  const { data: group, error: groupError } = await service
    .from("groups")
    .insert({
      tournament_id: tournament.id,
      name: parsed.name,
      invite_code: createInviteCode(parsed.inviteCode),
      created_by: user.id,
      prize_mode: parsed.prizeMode,
      currency: parsed.currency.toUpperCase(),
      sponsor_name: parsed.sponsorName || null,
      base_prize_amount: parsed.basePrizeAmount ?? null,
      buy_in_amount: parsed.buyInAmount ?? null,
      buy_in_required: parsed.buyInRequired ?? false,
      payout_description: parsed.payoutDescription || null
    })
    .select("id")
    .single();

  if (groupError) throw groupError;

  const { error: memberError } = await service.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin"
  });
  if (memberError) throw memberError;

  const { error: settingsError } = await service.from("group_score_settings").insert({
    group_id: group.id
  });
  if (settingsError) throw settingsError;

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function joinGroup(formData: FormData) {
  const inviteCode = createInviteCode(String(formData.get("inviteCode")));
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureProfile(user.id, user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Player");

  const service = createServiceClient();
  const { data: group, error: groupError } = await service
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (groupError) throw groupError;

  const { error } = await service.from("group_members").upsert(
    {
      group_id: group.id,
      user_id: user.id,
      role: "member"
    },
    { onConflict: "group_id,user_id", ignoreDuplicates: true }
  );

  if (error) throw error;
  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function updateGroupSettings(formData: FormData) {
  const groupId = String(formData.get("groupId"));
  const parsed = createGroupSchema
    .omit({ tournamentCode: true, inviteCode: true })
    .parse({
      name: formData.get("name"),
      prizeMode: formData.get("prizeMode"),
      currency: formData.get("currency") || "NOK",
      sponsorName: formData.get("sponsorName") || undefined,
      basePrizeAmount: formData.get("basePrizeAmount") || undefined,
      buyInAmount: formData.get("buyInAmount") || undefined,
      buyInRequired: formData.get("buyInRequired") === "on",
      payoutDescription: formData.get("payoutDescription") || undefined
    });

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({
      name: parsed.name,
      prize_mode: parsed.prizeMode,
      currency: parsed.currency.toUpperCase(),
      sponsor_name: parsed.sponsorName || null,
      base_prize_amount: parsed.basePrizeAmount ?? null,
      buy_in_amount: parsed.buyInAmount ?? null,
      buy_in_required: parsed.buyInRequired ?? false,
      payout_description: parsed.payoutDescription || null
    })
    .eq("id", groupId);

  if (error) throw error;
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(formData: FormData) {
  const groupId = String(formData.get("groupId"));
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function markPaid(formData: FormData) {
  const groupId = String(formData.get("groupId"));
  const memberId = String(formData.get("memberId"));
  const hasPaid = formData.get("hasPaid") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .update({ has_paid: hasPaid })
    .eq("id", memberId);

  if (error) throw error;
  revalidatePath(`/groups/${groupId}`);
}

async function ensureProfile(userId: string, displayName: string) {
  const service = createServiceClient();
  await service.from("profiles").upsert({
    id: userId,
    display_name: displayName
  });
}
