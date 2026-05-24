"use client";

import { useActionState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { joinGroup } from "@/app/actions/groups";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function DashboardActions({
  defaultDisplayName
}: {
  defaultDisplayName: string;
}) {
  const [joinState, joinAction] = useActionState(joinGroup, {});

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <KeyRound className="h-4 w-4" />
            Join with code
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a group</DialogTitle>
            <DialogDescription>Enter an invite code from another Tippa pool.</DialogDescription>
          </DialogHeader>
          <form action={joinAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite code</Label>
              <Input id="inviteCode" name="inviteCode" placeholder="CREW-2026" required />
            </div>
            {joinState.error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                {joinState.error}
              </p>
            ) : null}
            <SubmitButton idleText="Join group" pendingText="Joining..." successText="Joined" className="w-full" />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserRound className="h-4 w-4" />
            Display name
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Display name</DialogTitle>
            <DialogDescription>
              This is your default leaderboard name. You can still set a different name inside each group.
            </DialogDescription>
          </DialogHeader>
          <form action={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Default name</Label>
              <Input id="displayName" name="displayName" defaultValue={defaultDisplayName} required />
            </div>
            <SubmitButton idleText="Save name" pendingText="Saving..." successText="Saved" className="w-full" />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
