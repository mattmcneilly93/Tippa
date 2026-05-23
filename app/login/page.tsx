import { Mail } from "lucide-react";
import { signInWithMagicLink, signInWithOAuth } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  return (
    <main className="page-shell flex min-h-[75vh] items-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in to Tippa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={signInWithOAuth}>
            <input type="hidden" name="provider" value="google" />
            <Button className="w-full" type="submit">
              Continue with Google
            </Button>
          </form>
          <form action={signInWithOAuth}>
            <input type="hidden" name="provider" value="apple" />
            <Button className="w-full" type="submit" variant="outline">
              Continue with Apple
            </Button>
          </form>
          <form action={signInWithMagicLink} className="space-y-3 rounded-3xl bg-muted p-4">
            <Label htmlFor="email">Email magic link</Label>
            <div className="flex gap-2">
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              <Button type="submit" size="icon" aria-label="Send magic link">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <SentNotice searchParams={searchParams} />
        </CardContent>
      </Card>
    </main>
  );
}

async function SentNotice({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  if (!params.sent) return null;
  return <p className="text-sm font-semibold text-[var(--tippa-secondary)]">Magic link sent.</p>;
}
