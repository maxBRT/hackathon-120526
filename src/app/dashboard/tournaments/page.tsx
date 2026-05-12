import Link from "next/link";
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { requireOrganizer } from "@/lib/auth";
import { formatUserDisplayName } from "@/lib/format-user";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function registeredPlayersFor(
  teams: Array<{
    _count: {
      members: number;
    };
  }>
) {
  return teams.reduce((total, team) => total + team._count.members, 0);
}

function formatEntryFee(entryFee: number, currency: string) {
  if (entryFee === 0) {
    return "Free";
  }

  return `${entryFee} ${currency}`;
}

export default async function DashboardTournamentsPage() {
  const user = await requireOrganizer();

  const tournaments = await prisma.tournament.findMany({
    where: user.role === "ADMIN" ? {} : { organizerId: user.id },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      organizer: true,
      teams: {
        select: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organizer dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Tournament management
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {user.role === "ADMIN"
              ? "Signed in as admin — you can manage every tournament."
              : "Signed in as an organizer — manage the tournaments you created."}
          </p>
        </div>
        <Link
          href="/dashboard/tournaments/new"
          className={buttonVariants({ variant: "default" })}
        >
          <PlusIcon />
          New tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tournaments to manage</CardTitle>
            <CardDescription>
              Add a tournament to start building the public tournament list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CalendarPlusIcon />
              <AlertTitle>Create the first tournament</AlertTitle>
              <AlertDescription>
                The form will ask for an organizer until auth supplies that
                value automatically.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All tournaments</CardTitle>
            <CardDescription>
              Showing all records while dashboard access is open.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell>
                      <div className="font-medium">{tournament.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {tournament.sport} in {tournament.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatUserDisplayName(
                        tournament.organizer.firstName,
                        tournament.organizer.lastName
                      )}
                    </TableCell>
                    <TableCell>
                      {dateFormatter.format(tournament.startDate)}
                    </TableCell>
                    <TableCell>{tournament.teams.length}</TableCell>
                    <TableCell>
                      {registeredPlayersFor(tournament.teams)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tournament.entryFee > 0 ? "default" : "secondary"}
                      >
                        {formatEntryFee(tournament.entryFee, tournament.currency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          <ExternalLinkIcon />
                          View
                        </Link>
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}/teams`}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          <UsersIcon />
                          Teams
                        </Link>
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}/edit`}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Edit
                        </Link>
                        <DeleteTournamentButton
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
