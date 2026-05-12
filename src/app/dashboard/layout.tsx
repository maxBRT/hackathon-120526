import type { ReactNode } from "react";

import { requireOrganizer } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireOrganizer();
  return children;
}
