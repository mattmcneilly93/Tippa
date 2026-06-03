export const env = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_placeholder",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  cronSecret: process.env.CRON_SECRET,
  devMode: process.env.DEV_MODE === "true" && process.env.NODE_ENV !== "production",
  devMembership: process.env.DEV_MEMBERSHIP,
  devUserId: process.env.DEV_USER_ID
};

export function requireSupabaseSecretKey() {
  if (!env.supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for this server task.");
  }
  return env.supabaseSecretKey;
}
