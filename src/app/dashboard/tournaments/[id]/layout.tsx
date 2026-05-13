import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { TournamentDashboardShell } from "@/components/tournament-dashboard-shell";
import { getTournamentForDashboard } from "@/lib/tournament-dashboard";

export default async function TournamentDashboardLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournamentForDashboard(id);
  if (!tournament) {
    notFound();
  }

  return (
    <TournamentDashboardShell tournament={tournament}>
      {children}
    </TournamentDashboardShell>
  );
}
