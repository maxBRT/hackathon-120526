import type { ReactNode } from "react";

import { DashboardNav } from "@/components/dashboard-nav";
import { requireOrganizer } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireOrganizer();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardNav />
      {children}
    </div>
  );
}
