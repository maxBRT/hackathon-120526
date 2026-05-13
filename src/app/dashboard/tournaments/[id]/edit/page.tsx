import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, UsersIcon } from "lucide-react";

import { updateTournament } from "@/app/dashboard/tournaments/actions";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { buttonVariants } from "@/components/ui/button";
import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditTournamentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditTournamentPage({
  params,
}: EditTournamentPageProps) {
  const { id } = await params;

  const user = await requireOrganizer();

  const tournament = await prisma.tournament.findUnique({
    where: {
      id,
    },
    include: {
      organizer: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    notFound();
  }

  const sports = await (prisma as any).sport.findMany({ orderBy: { name: 'asc' } });

  const updateTournamentWithId = updateTournament.bind(null, tournament.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organizer dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Edit tournament
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/tournaments/${tournament.id}/matches`}
            className={buttonVariants({ variant: "outline" })}
          >
            <CalendarIcon className="size-4" />
            Matches
          </Link>
          <Link
            href={`/dashboard/tournaments/${tournament.id}/teams`}
            className={buttonVariants({ variant: "outline" })}
          >
            <UsersIcon />
            Manage teams
          </Link>
          <DeleteTournamentButton
            tournamentId={tournament.id}
            tournamentName={tournament.name}
          />
        </div>
      </div>

      <TournamentForm
        variant="edit"
        title={tournament.name}
        organizerSummary={{
          firstName: tournament.organizer.firstName,
          lastName: tournament.organizer.lastName,
          email: tournament.organizer.email,
        }}
        action={updateTournamentWithId}
        submitLabel="Save changes"
        initialValues={{
          name: tournament.name,
          sport: tournament.sport,
          city: tournament.city,
          startDate: toDateInputValue(tournament.startDate),
          entryFee: String(tournament.entryFee),
          currency: tournament.currency,
        }}
        sports={sports.map((s: any) => ({ id: s.id, name: s.name }))}
      />
    </main>
  );
}
