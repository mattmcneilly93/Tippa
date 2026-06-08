"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app-button";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8 py-8 text-center">
        <h1 className="bg-gradient-to-r from-[#002fa7] via-[#2f6bff] to-[#7db4ff] bg-clip-text text-8xl font-black leading-[0.9] tracking-tight text-transparent md:text-[12rem]">
          mmmmundial
        </h1>
        <p className="max-w-xl text-xl text-muted-foreground">
          Make a private World Cup prediction game for friends, families, or teams,
          share a code, and watch the table move after every result.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Join with code <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <InstallAppButton />
      </section>
    </main>
  );
}
