import Link from "next/link";
import { Trophy } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { signOut } from "@/app/actions/auth";
import Image from "next/image";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <>
      <ServiceWorkerRegister />
      <PullToRefresh />
      <header className="sticky top-0 z-30 border-b bg-[#fffaf0]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Image
              src="/icons/logo_transparent.webp"
              alt="Tippa logo"
              height={192}
              width={192}
              className="h-10 w-10 bg-transparent"
            />
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
