import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { formatUserDisplayName } from "@/lib/format-user";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TournamentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatEntryFee(entryFee: number, currency: string) {
  if (entryFee === 0) {
    return "Free";
  }

  return `${entryFee} ${currency}`;
}

export default async function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: true,
      teams: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
      _count: {
        select: { teams: true },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const registeredPlayers = tournament.teams.reduce(
    (total, team) => total + team._count.members,
    0
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Public tournament
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {tournament.name}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {tournament.sport} tournament in {tournament.city}, organized by{" "}
            {formatUserDisplayName(
              tournament.organizer.firstName,
              tournament.organizer.lastName
            )}.
          </p>
        </div>
        <Badge variant={tournament.entryFee > 0 ? "default" : "secondary"}>
          {formatEntryFee(tournament.entryFee, tournament.currency)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Start date</CardTitle>
            <CardDescription>
              {dateFormatter.format(tournament.startDate)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>{tournament._count.teams} registered</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>{registeredPlayers} current players</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament details</CardTitle>
          <CardDescription>
            Public information for players browsing tournaments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Sport</dt>
              <dd className="font-medium">{tournament.sport}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd className="font-medium">{tournament.city}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Entry fee</dt>
              <dd className="font-medium">
                {formatEntryFee(tournament.entryFee, tournament.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Organizer contact</dt>
              <dd className="font-medium">{tournament.organizer.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Team management is handled by the organizer dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournament.teams.length === 0 ? (
            <Alert>
              <UsersIcon />
              <AlertTitle>No teams yet</AlertTitle>
              <AlertDescription>
                Teams created for this tournament will appear here.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/tournaments/${id}/teams/${team.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{team._count.members}</TableCell>
                    <TableCell>
                      {team._count.members} / {team.maxCapacity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
