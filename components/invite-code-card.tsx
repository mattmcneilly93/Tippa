"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteCodeCard({ code }: { code: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite code</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <code className="rounded-2xl bg-muted px-4 py-3 text-lg font-black">{code}</code>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Copy invite code"
          onClick={() => navigator.clipboard.writeText(code)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
