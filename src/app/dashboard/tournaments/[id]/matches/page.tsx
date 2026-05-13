import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, PlusIcon } from "lucide-react";

import { DeleteMatchButton } from "@/components/matches/delete-match-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function TournamentMatchesPage({ params }: MatchesPageProps) {
  const { id } = await params;

  const user = await requireOrganizer();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  const matches =
    tournament != null
      ? await prisma.match.findMany({
          where: {
            AND: [
              { teamA: { tournamentId: id } },
              { teamB: { tournamentId: id } },
            ],
          },
          orderBy: { date: "asc" },
          include: {
            teamA: { select: { name: true } },
            teamB: { select: { name: true } },
          },
        })
      : [];

  if (!tournament) {
    notFound();
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    notFound();
  }

  function scoreLine(match: (typeof matches)[number]) {
    if (match.scoreA != null && match.scoreB != null) {
      return `${match.scoreA} – ${match.scoreB}`;
    }
    return "—";
  }

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organizer dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Matches</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Schedule for{" "}
            <span className="font-medium text-foreground">{tournament.name}</span>
            {", "}
            {tournament.sport} in {tournament.city}.
          </p>
        </div>
        <Link
          href={`/dashboard/tournaments/${id}/matches/new`}
          className={buttonVariants({ variant: "default" })}
        >
          <PlusIcon />
          Schedule match
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            Match list
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches scheduled yet. Add at least two teams, then schedule a match.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const label = `${match.teamA.name} vs ${match.teamB.name}`;
                  return (
                    <TableRow key={match.id}>
                      <TableCell className="whitespace-nowrap">
                        {dateTimeFormatter.format(match.date)}
                      </TableCell>
                      <TableCell>{match.location}</TableCell>
                      <TableCell>
                        <span className="font-medium">{match.teamA.name}</span>
                        {" vs "}
                        <span className="font-medium">{match.teamB.name}</span>
                      </TableCell>
                      <TableCell>{scoreLine(match)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/dashboard/tournaments/${id}/matches/${match.id}/edit`}
                            className={buttonVariants({ variant: "outline" })}
                          >
                            Edit
                          </Link>
                          <DeleteMatchButton
                            tournamentId={id}
                            matchId={match.id}
                            label={label}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
