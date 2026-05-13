import Link from "next/link";
import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { TournamentSectionTabs } from "./tournament-section-tabs";

type TournamentLite = {
  id: string;
  name: string;
};

export function TournamentDashboardShell({
  tournament,
  children,
}: {
  tournament: TournamentLite;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-10 sm:px-6 lg:px-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard/tournaments" />}>
              Tournaments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tournament.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TournamentSectionTabs tournamentId={tournament.id} />
      <div className="mt-8 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
