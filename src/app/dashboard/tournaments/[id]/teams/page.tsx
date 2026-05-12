import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

type TeamsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TournamentTeamsPage({ params }: TeamsPageProps) {
  const { id } = await params;

  const user = await requireOrganizer();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  if (user.role !== "ADMIN" && tournament.organizerId !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organizer dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Teams
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Manage teams for{" "}
            <span className="font-medium text-foreground">{tournament.name}</span>
            {", "}
            {tournament.sport} in {tournament.city}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/tournaments/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Tournament settings
          </Link>
          <Link
            href={`/dashboard/tournaments/${id}/teams/new`}
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon />
            New team
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Registered teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tournament.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teams yet. Create a team to open registration for players.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.teams.map((team) => {
                  const filled = team._count.members;
                  const cap = team.maxCapacity;
                  const full = filled >= cap;

                  return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        <Badge variant={full ? "default" : "secondary"}>
                          {filled} / {cap} players
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/tournaments/${id}/teams/${team.id}/edit`}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Edit
                        </Link>
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
