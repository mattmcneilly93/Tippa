import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Resolve the public origin from forwarded headers so redirects work behind a
// proxy/tunnel (e.g. ngrok) where request.url is the internal localhost address.
async function resolveOrigin(request: NextRequest) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (host) {
    const protocol =
      headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = await resolveOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback exchange failed", error);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "auth");
      redirectUrl.searchParams.set("reason", error.code ?? error.name ?? "exchange-failed");
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing-code", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
