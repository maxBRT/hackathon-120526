import type { ReactNode } from "react";
import Link from "next/link";

import { requireOrganizer } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireOrganizer();

  const navLinkClass =
    "text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="Dashboard"
        className="border-border border-b px-4 py-3 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2">
          <Link href="/dashboard/tournaments" className={cn(navLinkClass)}>
            Tournaments
          </Link>
          <Link href="/dashboard/requests" className={cn(navLinkClass)}>
            Join requests
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
