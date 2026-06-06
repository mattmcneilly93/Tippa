"use client";

import { useEffect, useState } from "react";
import { Copy, LinkIcon, UsersRound, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { markPaid } from "@/app/actions/groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";

type GroupMember = {
  id: string;
  role: string;
  has_paid: boolean;
  display_name?: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

type GroupOverviewActionsProps = {
  groupId: string;
  inviteCode: string;
  isAdmin: boolean;
  tracksBuyIns: boolean;
  members: GroupMember[];
};

function memberName(member: GroupMember) {
  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
  return member.display_name?.trim() || profile?.display_name || "Player";
}

export function GroupOverviewActions({
  groupId,
  inviteCode,
  isAdmin,
  tracksBuyIns,
  members
}: GroupOverviewActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [inviteUrl, setInviteUrl] = useState(`/invite?code=${encodeURIComponent(inviteCode)}`);

  useEffect(() => {
    setInviteUrl(new URL(`/invite?code=${encodeURIComponent(inviteCode)}`, window.location.origin).toString());
  }, [inviteCode]);

  async function copyInvite(value: string, type: "link" | "code") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1500);
  }

  async function updatePayment(formData: FormData) {
    await markPaid(formData);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Copy className="h-4 w-4" />
            Invite
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite link</DialogTitle>
            <DialogDescription>Share this link with people who should join the pool.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={copied === "link" ? "success" : "outline"}
              onClick={() => copyInvite(inviteUrl, "link")}
            >
              <LinkIcon className="h-4 w-4" />
              {copied === "link" ? "Link copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant={copied === "code" ? "success" : "outline"}
              onClick={() => copyInvite(inviteCode, "code")}
            >
              <Copy className="h-4 w-4" />
              {copied === "code" ? "Code copied" : "Copy code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {tracksBuyIns ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <WalletCards className="h-4 w-4" />
              Payments
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payments</DialogTitle>
              <DialogDescription>Track who has paid for this pool outside mundial.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black">{memberName(member)}</p>
                    <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                  </div>
                  {isAdmin ? (
                    <form action={updatePayment}>
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="memberId" value={member.id} />
                      <input
                        type="hidden"
                        name="hasPaid"
                        value={member.has_paid ? "false" : "true"}
                      />
                      <SubmitButton
                        idleText={member.has_paid ? "Paid" : "Mark paid"}
                        successText="Updated"
                        variant={member.has_paid ? "success" : "outline"}
                        size="sm"
                      />
                    </form>
                  ) : (
                    <Badge variant={member.has_paid ? "warm" : "outline"}>
                      {member.has_paid ? "Paid" : "Unpaid"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <UsersRound className="h-4 w-4" />
              {members.length} members
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Members</DialogTitle>
              <DialogDescription>The leaderboard is the main member view for this pool.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <div key={member.id} className="rounded-2xl bg-muted p-3">
                  <p className="truncate font-black">{memberName(member)}</p>
                  <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
