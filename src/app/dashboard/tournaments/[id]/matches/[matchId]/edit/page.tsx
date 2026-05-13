import { notFound } from "next/navigation";

import { updateMatch } from "@/app/dashboard/tournaments/[id]/matches/actions";
import { MatchForm } from "@/components/matches/match-form";
import { requireOrganizer } from "@/lib/auth";
import { toDatetimeLocalInputValue } from "@/lib/datetime-local";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditMatchPageProps = {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
};

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { id, matchId } = await params;

  const user = await requireOrganizer();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: {
        include: {
          tournament: {
            select: { id: true, name: true, sport: true, city: true, organizerId: true },
          },
        },
      },
      teamB: true,
    },
  });

  if (!match) {
    notFound();
  }

  if (match.teamA.tournamentId !== id || match.teamB.tournamentId !== id) {
    notFound();
  }

  if (user.role !== "ADMIN" && match.teamA.tournament.organizerId !== user.id) {
    notFound();
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const tournament = match.teamA.tournament;
  const tournamentSummary = `${tournament.name} · ${tournament.sport} · ${tournament.city}`;
  const action = updateMatch.bind(null, id, matchId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Organizer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit match</h1>
      </div>

      <MatchForm
        variant="edit"
        title={`${match.teamA.name} vs ${match.teamB.name}`}
        tournamentSummary={tournamentSummary}
        tournamentId={id}
        teams={teams}
        action={action}
        submitLabel="Save match"
        initialValues={{
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          date: toDatetimeLocalInputValue(match.date),
          location: match.location,
          scoreA: match.scoreA != null ? String(match.scoreA) : "",
          scoreB: match.scoreB != null ? String(match.scoreB) : "",
        }}
      />
    </main>
  );
}
