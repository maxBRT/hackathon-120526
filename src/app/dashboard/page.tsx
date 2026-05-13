import Link from "next/link";
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  InboxIcon,
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

const RECENT_TOURNAMENTS_LIMIT = 5;

function formatEntryFee(entryFee: number, currency: string) {
  if (entryFee === 0) {
    return "Free";
  }

  return `${entryFee} ${currency}`;
}

export default async function DashboardHomePage() {
  const user = await requireOrganizer();
  const isAdmin = user.role === "ADMIN";
  const organizerTournamentFilter = isAdmin ? {} : { organizerId: user.id };
  const tournamentWhere = isAdmin ? {} : { organizerId: user.id };

  const [
    tournamentCount,
    teamCount,
    pendingJoinRequestCount,
    recentTournaments,
  ] = await Promise.all([
    prisma.tournament.count({ where: tournamentWhere }),
    prisma.team.count({
      where: { tournament: organizerTournamentFilter },
    }),
    prisma.joinRequest.count({
      where: {
        status: "PENDING",
        team: { tournament: organizerTournamentFilter },
      },
    }),
    prisma.tournament.findMany({
      where: tournamentWhere,
      orderBy: { updatedAt: "desc" },
      take: RECENT_TOURNAMENTS_LIMIT,
      select: {
        id: true,
        name: true,
        sport: true,
        city: true,
        startDate: true,
        entryFee: true,
        currency: true,
        organizer: {
          select: { firstName: true, lastName: true },
        },
        _count: { select: { teams: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Organizer dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Overview</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/requests" className={buttonVariants({ variant: "outline" })}>
            <InboxIcon />
            Join requests
            {pendingJoinRequestCount > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {pendingJoinRequestCount}
              </Badge>
            ) : null}
          </Link>
          <Link href="/dashboard/tournaments/new" className={buttonVariants({ variant: "default" })}>
            <PlusIcon />
            New tournament
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tournaments</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{tournamentCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tournamentCount === 0
                ? "Create a tournament to get started."
                : "Tournaments you can manage from this dashboard."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total teams</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{teamCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tournamentCount === 0
                ? "Teams will appear after you create a tournament."
                : tournamentCount === 1
                  ? "Across your tournament."
                  : "Across your tournaments."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending join requests</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{pendingJoinRequestCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pendingJoinRequestCount === 0
                ? "Nothing waiting for review."
                : (
                    <Link href="/dashboard/requests" className="font-medium text-foreground underline-offset-4 hover:underline">
                      Review requests
                    </Link>
                  )}
            </p>
          </CardContent>
        </Card>
      </div>

      {tournamentCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Add a tournament to start building the public tournament list.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert>
              <CalendarPlusIcon />
              <AlertTitle>Create the first tournament</AlertTitle>
              <AlertDescription>
                You will set sport, location, schedule, and optional entry fees on the next
                screen.
              </AlertDescription>
            </Alert>
            <Link href="/dashboard/tournaments/new" className={buttonVariants({ variant: "default", className: "w-fit" })}>
              <PlusIcon />
              Create tournament
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Recent tournaments</CardTitle>
              <CardDescription>
                Up to {RECENT_TOURNAMENTS_LIMIT} most recently updated.{" "}
                <Link href="/dashboard/tournaments" className="text-foreground underline-offset-4 hover:underline">
                  View all
                </Link>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTournaments.map((tournament) => (
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
                    <TableCell>{dateFormatter.format(tournament.startDate)}</TableCell>
                    <TableCell>{tournament._count.teams}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tournament.entryFee > 0 ? "default" : "secondary"}
                      >
                        {formatEntryFee(tournament.entryFee, tournament.currency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <ExternalLinkIcon />
                          View
                        </Link>
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}/matches`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <CalendarPlusIcon />
                          Matches
                        </Link>
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}/teams`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <UsersIcon />
                          Teams
                        </Link>
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
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
