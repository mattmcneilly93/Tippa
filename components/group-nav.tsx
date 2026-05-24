"use client";

import Link from "next/link";
import { Home, Settings, Shield, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GroupNav({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    ["Overview", `/groups/${groupId}`, Home],
    ["Predictions", `/groups/${groupId}/predictions`, Trophy],
    ["Settings", `/groups/${groupId}/settings`, Settings]
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {links.map(([label, href, Icon]) => {
        const active = pathname === href;
        return (
          <Button
            key={label}
            asChild
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn(
              active && "bg-[var(--tippa-accent)] text-[var(--tippa-primary)] hover:bg-[var(--tippa-accent)]"
            )}
          >
            <Link href={href}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          </Button>
        );
      })}
      {isAdmin ? (
        <Button
          asChild
          variant={pathname === `/groups/${groupId}/admin` ? "default" : "secondary"}
          size="sm"
          className={cn(
            pathname === `/groups/${groupId}/admin` &&
              "bg-[var(--tippa-accent)] text-[var(--tippa-primary)] hover:bg-[var(--tippa-accent)]"
          )}
        >
          <Link href={`/groups/${groupId}/admin`}>
            <Shield className="h-4 w-4" /> Admin
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
