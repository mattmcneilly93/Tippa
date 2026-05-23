"use client";

import Link from "next/link";
import { ArrowRight, Users, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "@/components/motion";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="grid min-h-[calc(100vh-5rem)] items-center gap-8 py-8 md:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full bg-[#fff4d6] px-4 py-2 text-sm font-bold">
            Football pools for your private circle
          </div>
          <h1 className="max-w-2xl text-6xl font-black leading-[0.92] tracking-normal md:text-8xl">
            Tippa
          </h1>
          <p className="max-w-xl text-xl text-muted-foreground">
            Make a private World Cup prediction game for friends, families, or teams,
            share a code, and watch the table move after every result.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/groups/new">
                Create a pool <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Join with code</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {[
            ["World Cup 2026", "Pick scores before kickoff", Trophy],
            ["Flexible prizes", "Choose no prize, a sponsor, a buy-in, or a mix", Sparkles],
            ["Private table", "Only people with the code can join", Users]
          ].map(([title, text, Icon], index) => (
            <motion.div
              key={String(title)}
              initial={{ opacity: 0, y: 20, rotate: index === 1 ? 1 : -1 }}
              animate={{ opacity: 1, y: 0, rotate: index === 1 ? 1 : -1 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="poster-pattern">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xl font-black">{String(title)}</p>
                    <p className="text-muted-foreground">{String(text)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
