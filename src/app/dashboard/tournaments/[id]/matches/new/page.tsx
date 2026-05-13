import { notFound } from "next/navigation";

import { createMatch } from "@/app/dashboard/tournaments/[id]/matches/actions";
import { MatchForm } from "@/components/matches/match-form";
import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewMatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewMatchPage({ params }: NewMatchPageProps) {
  const { id } = await params;

  const user = await requireOrganizer();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    notFound();
  }

  const tournamentSummary = `${tournament.name} · ${tournament.sport} · ${tournament.city}`;
  const action = createMatch.bind(null, tournament.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Organizer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Schedule match
        </h1>
      </div>

      <MatchForm
        variant="create"
        title="New match"
        description="Pick two teams from this tournament, then set the time and location."
        tournamentSummary={tournamentSummary}
        tournamentId={tournament.id}
        teams={tournament.teams}
        action={action}
        submitLabel="Create match"
      />
    </main>
  );
}
