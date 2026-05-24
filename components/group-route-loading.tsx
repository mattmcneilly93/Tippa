import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function GroupRouteLoading() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="h-6 w-40 rounded-full bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 rounded-2xl bg-muted" />
          <div className="h-12 rounded-2xl bg-muted" />
          <div className="h-12 rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
