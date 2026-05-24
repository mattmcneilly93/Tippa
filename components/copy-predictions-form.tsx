"use client";

import { useRouter } from "next/navigation";
import { copyPredictionsFromGroup } from "@/app/actions/predictions";
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
    <form action={copyPredictions} className="grid gap-3 md:grid-cols-[1fr_auto]">
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
          Copies compatible picks from your other group in this tournament.
        </p>
      </div>
      <SubmitButton
        idleText="Copy picks"
        pendingText="Copying..."
        successText="Copied"
        className="md:self-start"
      />
    </form>
  );
}
