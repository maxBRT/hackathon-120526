import { cache } from "react";

import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const getTournamentForDashboard = cache(async (id: string) => {
  const user = await requireOrganizer();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sport: true,
      city: true,
      organizerId: true,
    },
  });

  if (!tournament) {
    return null;
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    return null;
  }

  return tournament;
});
