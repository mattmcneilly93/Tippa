"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GroupNav } from "@/components/group-nav";
import { GroupRouteLoading } from "@/components/group-route-loading";

type GroupRouteFrameProps = {
  groupId: string;
  isAdmin: boolean;
  overviewActions?: ReactNode;
  predictionActions?: ReactNode;
  children: ReactNode;
};

export function GroupRouteFrame({
  groupId,
  isAdmin,
  overviewActions,
  predictionActions,
  children
}: GroupRouteFrameProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <>
      <GroupNav
        groupId={groupId}
        isAdmin={isAdmin}
        overviewActions={overviewActions}
        predictionActions={predictionActions}
        pendingHref={pendingHref}
        onNavigate={setPendingHref}
      />
      {pendingHref ? <GroupRouteLoading /> : children}
    </>
  );
}
