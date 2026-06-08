"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app-button";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8 overflow-hidden py-8 text-center">

        {/* Background goalkeeper image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/image-1780952368109.webp')" }}
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Flaming ball — positioned over the ball in the photo */}
        <div className="absolute"
          style={{ bottom: "28%", right: "22%" }}>
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-6 animate-ping rounded-full bg-orange-500/30" />
          <div className="absolute inset-0 -m-3 rounded-full bg-gradient-radial from-yellow-400/60 to-transparent blur-md" />
          {/* Flame core */}
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-tr from-red-600 via-orange-400 to-yellow-300 opacity-80 blur-sm" />
          {/* Flame streaks */}
          <div className="absolute -left-8 top-1/2 h-3 w-10 -translate-y-1/2 rounded-full bg-gradient-to-l from-orange-500/80 to-transparent blur-sm" />
          <div className="absolute -left-6 top-1/3 h-2 w-8 -translate-y-1/2 rounded-full bg-gradient-to-l from-yellow-400/70 to-transparent blur-sm" />
          <div className="absolute -left-6 top-2/3 h-2 w-7 -translate-y-1/2 rounded-full bg-gradient-to-l from-red-500/70 to-transparent blur-sm" />
        </div>

        {/* Content */}
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
