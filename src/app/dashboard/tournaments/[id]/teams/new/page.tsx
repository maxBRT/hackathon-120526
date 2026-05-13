import { notFound } from "next/navigation";

import { createTeam } from "@/app/dashboard/tournaments/[id]/teams/actions";
import { TeamForm } from "@/components/teams/team-form";
import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewTeamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewTeamPage({ params }: NewTeamPageProps) {
  const { id } = await params;

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
    notFound();
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    notFound();
  }

  const tournamentSummary = `${tournament.name} · ${tournament.sport} · ${tournament.city}`;
  const action = createTeam.bind(null, tournament.id);

  return (
    <main className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Organizer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create team
        </h1>
      </div>

      <TeamForm
        variant="create"
        title="New team"
        description="Register a team under this tournament and set how many players it can hold."
        tournamentSummary={tournamentSummary}
        tournamentId={tournament.id}
        action={action}
        submitLabel="Create team"
        initialValues={{ maxCapacity: "15" }}
      />
    </main>
  );
}
