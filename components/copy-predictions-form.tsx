"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { copyPredictionsFromGroup } from "@/app/actions/predictions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

type CopyableGroup = {
  id: string;
  name: string;
};

export function CopyPredictionsForm({
  targetGroupId,
  copyableGroups
}: {
  targetGroupId: string;
  copyableGroups: CopyableGroup[];
}) {
  const router = useRouter();

  async function copyPredictions(formData: FormData) {
    await copyPredictionsFromGroup(formData);
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Copy className="h-4 w-4" />
          Import picks
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import picks from another group</DialogTitle>
          <DialogDescription>
            Bring compatible picks into this group from another group in the same tournament.
          </DialogDescription>
        </DialogHeader>
        <form action={copyPredictions} className="space-y-4">
          <input type="hidden" name="targetGroupId" value={targetGroupId} />
          <div className="space-y-2">
            <Select name="sourceGroupId" defaultValue={copyableGroups[0]?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Choose group" />
              </SelectTrigger>
              <SelectContent>
                {copyableGroups.map((copyableGroup) => (
                  <SelectItem key={copyableGroup.id} value={copyableGroup.id}>
                    {copyableGroup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Existing picks in this group will be replaced where the formats match.
            </p>
          </div>
          <SubmitButton
            idleText="Import picks"
            pendingText="Importing..."
            successText="Imported"
            className="w-full"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
