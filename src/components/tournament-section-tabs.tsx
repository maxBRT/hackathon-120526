"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type TournamentSectionTabsProps = {
  tournamentId: string;
};

export function TournamentSectionTabs({
  tournamentId,
}: TournamentSectionTabsProps) {
  const pathname = usePathname() ?? "";
  const base = `/dashboard/tournaments/${tournamentId}`;

  const isSettings = pathname === `${base}/edit`;
  const isTeams = pathname.startsWith(`${base}/teams`);
  const isMatches = pathname.startsWith(`${base}/matches`);

  const tab = (active: boolean) =>
    cn(
      "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-transparent bg-primary text-primary-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Tournament sections">
      <Link href={`${base}/edit`} className={tab(isSettings)}>
        Settings
      </Link>
      <Link href={`${base}/teams`} className={tab(isTeams)}>
        Teams
      </Link>
      <Link href={`${base}/matches`} className={tab(isMatches)}>
        Matches
      </Link>
    </nav>
  );
}
