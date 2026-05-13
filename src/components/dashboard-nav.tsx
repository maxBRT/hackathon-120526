"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function linkClass(active: boolean) {
  return cn(
    "text-sm font-medium underline-offset-4 transition-colors hover:underline",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  );
}

export function DashboardNav() {
  const pathname = usePathname() ?? "";

  const siteActive = pathname === "/";
  const overviewActive = pathname === "/dashboard";
  const tournamentsActive = pathname.startsWith("/dashboard/tournaments");
  const requestsActive = pathname.startsWith("/dashboard/requests");

  return (
    <nav
      aria-label="Dashboard"
      className="border-border border-b px-4 py-3 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2">
        <Link href="/" className={linkClass(siteActive)}>
          View site
        </Link>
        <Link href="/dashboard" className={linkClass(overviewActive)}>
          Overview
        </Link>
        <Link href="/dashboard/tournaments" className={linkClass(tournamentsActive)}>
          Tournaments
        </Link>
        <Link href="/dashboard/requests" className={linkClass(requestsActive)}>
          Join requests
        </Link>
      </div>
    </nav>
  );
}
