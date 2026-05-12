import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";

import { prisma } from "./prisma";

export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
});

export async function requireSignedInUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireOrganizer() {
  const user = await requireSignedInUser();
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    redirect("/tournaments");
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireSignedInUser();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/tournaments");
  }
  return user;
}
