"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app-button";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8 overflow-hidden py-8 text-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/goalkeeper2.jpeg')" }} />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="bg-gradient-to-r from-[#002fa7] via-[#2f6bff] to-[#7db4ff] bg-clip-text text-8xl font-black leading-[0.9] tracking-tight text-transparent md:text-[12rem]">
            mmmmundial
          </h1>
          <p className="max-w-xl text-xl text-white/90">
            mr + mrs m magasin invites you to get stoked about the 2026 World Cup, the invite code is mmmmundial
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Join with code <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          <InstallAppButton />
        </div>
      </section>
    </main>
  );
}
