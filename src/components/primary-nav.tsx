"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type PrimaryNavProps = {
  showDashboard: boolean;
  showMyRequests: boolean;
  showAdmin: boolean;
};

function navClass(active: boolean) {
  return cn(
    "text-sm font-medium underline-offset-4 transition-colors hover:underline",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  );
}

export function PrimaryNav({
  showDashboard,
  showMyRequests,
  showAdmin,
}: PrimaryNavProps) {
  const pathname = usePathname() ?? "";

  const tournamentsActive =
    pathname === "/tournaments" || pathname.startsWith("/tournaments/");
  const matchesActive =
    pathname === "/matches" || pathname.startsWith("/matches/");
  const myRequestsActive =
    pathname === "/my-requests" || pathname.startsWith("/my-requests/");
  const dashboardActive = pathname.startsWith("/dashboard");
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6"
    >
      <Link href="/tournaments" className={navClass(tournamentsActive)}>
        Tournaments
      </Link>
      <Link href="/matches" className={navClass(matchesActive)}>
        Matches
      </Link>
      {showMyRequests ? (
        <Link href="/my-requests" className={navClass(myRequestsActive)}>
          My requests
        </Link>
      ) : null}
      {showDashboard ? (
        <Link href="/dashboard" className={navClass(dashboardActive)}>
          Dashboard
        </Link>
      ) : null}
      {showAdmin ? (
        <Link href="/admin" className={navClass(adminActive)}>
          Admin
        </Link>
      ) : null}
    </nav>
  );
}
