import { WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="page-shell flex min-h-[70vh] items-center">
      <Card className="w-full">
        <CardHeader>
          <WifiOff className="h-10 w-10 text-[var(--tippa-secondary)]" />
          <CardTitle>You are offline</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          mundial can show the saved shell, but predictions need a connection so kickoff
          locks and scores stay fair.
        </CardContent>
      </Card>
    </main>
  );
}
