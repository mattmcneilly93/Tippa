import Link from "next/link";
import { Settings, Shield, Trophy, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GroupNav({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const links = [
    ["Predictions", `/groups/${groupId}/predictions`, Trophy],
    ["Leaderboard", `/groups/${groupId}/leaderboard`, Trophy],
    ["Prize", `/groups/${groupId}`, WalletCards],
    ["Members", `/groups/${groupId}#members`, Users],
    ["Settings", `/groups/${groupId}/settings`, Settings]
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {links.map(([label, href, Icon]) => (
        <Button key={label} asChild variant="outline" size="sm">
          <Link href={href}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        </Button>
      ))}
      {isAdmin ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/groups/${groupId}/admin`}>
            <Shield className="h-4 w-4" /> Admin
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
