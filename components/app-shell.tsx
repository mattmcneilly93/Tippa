import Link from "next/link";
import { Trophy } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { signOut } from "@/app/actions/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <>
      <ServiceWorkerRegister />
      <header className="sticky top-0 z-30 border-b bg-[#fffaf0]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="text-xl font-black">Tippa</span>
          </Link>
          <nav className="flex items-center gap-2">
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
