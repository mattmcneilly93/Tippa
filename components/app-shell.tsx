import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { signOut } from "@/app/actions/auth";
import { Wordmark } from "@/components/wordmark";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <>
      <ServiceWorkerRegister />
      <PullToRefresh />
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
          <div aria-hidden />
          <Link href={user ? "/dashboard" : "/"} className="justify-self-center text-base">
            <Wordmark />
          </Link>
          <nav className="flex items-center justify-end gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Groups</Link>
                </Button>
                <form action={signOut}>
                  <Button type="submit" variant="outline" size="sm">
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
