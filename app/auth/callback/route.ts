import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback exchange failed", error);
      const redirectUrl = new URL("/login", requestUrl.origin);
      redirectUrl.searchParams.set("error", "auth");
      redirectUrl.searchParams.set("reason", error.code ?? error.name ?? "exchange-failed");
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing-code", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
