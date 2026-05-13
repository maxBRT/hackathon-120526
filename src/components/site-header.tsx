import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { PrimaryNav } from "./primary-nav";
import { SiteHeaderAuth } from "./site-header-auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const showDashboard =
    user != null && (user.role === "ORGANIZER" || user.role === "ADMIN");
  const showMyRequests = user != null;

  return (
    <header className="border-border border-b">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
          >
            Tournament platform
          </Link>
          <PrimaryNav
            showDashboard={showDashboard}
            showMyRequests={showMyRequests}
          />
        </div>
        <SiteHeaderAuth />
      </div>
    </header>
  );
}
