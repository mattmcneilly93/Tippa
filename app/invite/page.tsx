import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { joinGroupFromInvite } from "@/app/actions/groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvitePreview, hasJoinedGroup } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";
import { createInviteCode } from "@/lib/utils";

export default async function InvitePage({
  searchParams
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const params = await searchParams;
  const inviteCode = createInviteCode(params.code ?? "");
  const invite = await getInvitePreview(inviteCode);
  const user = await getUser();
  const alreadyJoined = user && invite ? await hasJoinedGroup(invite.id, user.id) : false;
  const tournament = Array.isArray(invite?.tournaments) ? invite?.tournaments[0] : invite?.tournaments;

  return (
    <main className="page-shell flex min-h-[75vh] items-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Join a mundial pool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invite ? (
            <>
              <p className="text-sm text-muted-foreground">
                This invite link is missing a valid invite code.
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-3xl bg-muted p-4">
                <Badge variant="warm">{tournament?.name ?? "Tournament"}</Badge>
                <h1 className="mt-3 text-3xl font-black">{invite.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invite code <span className="font-black text-foreground">{invite.invite_code}</span>
                </p>
              </div>
              {params.error ? (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                  Could not join that group. Try again.
                </p>
              ) : null}
              {alreadyJoined ? (
                <Button asChild className="w-full">
                  <Link href={`/groups/${invite.id}`}>
                    Open group <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : user ? (
                <form action={joinGroupFromInvite}>
                  <input type="hidden" name="inviteCode" value={invite.invite_code} />
                  <Button type="submit" className="w-full">
                    Join group <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/login?next=/invite?code=${encodeURIComponent(invite.invite_code)}`}>
                    Log in to join <LogIn className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
