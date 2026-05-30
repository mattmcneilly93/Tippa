import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("invite_code")) {
    const inviteUrl = request.nextUrl.clone();
    inviteUrl.pathname = "/invite";
    inviteUrl.searchParams.set("code", request.nextUrl.searchParams.get("invite_code") ?? "");
    inviteUrl.searchParams.delete("invite_code");
    return NextResponse.redirect(inviteUrl);
  }

  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  if (request.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)"]
};
