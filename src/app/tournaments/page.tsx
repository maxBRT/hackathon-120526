import Link from "next/link";
import { CalendarDaysIcon, PlusIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TournamentSummaryCard } from "@/components/tournaments/tournament-summary-card";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function registeredPlayersFor(
  teams: Array<{
    _count: {
      members: number;
    };
  }>
) {
  return teams.reduce((total, team) => total + team._count.members, 0);
}

export default async function TournamentsPage() {
  const user = await getCurrentUser();
  const canCreateTournament =
    user != null && (user.role === "ORGANIZER" || user.role === "ADMIN");

  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      startDate: "asc",
    },
    select: {
      id: true,
      name: true,
      sport: true,
      city: true,
      startDate: true,
      entryFee: true,
      currency: true,
      organizer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      teams: {
        select: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      _count: {
        select: {
          teams: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Public tournaments
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Find a tournament
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Browse upcoming tournaments, review entry fees, and see current team
            and player counts.
          </p>
        </div>
        {canCreateTournament ? (
          <Link
            href="/dashboard/tournaments/new"
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon />
            Create tournament
          </Link>
        ) : null}
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tournaments yet</CardTitle>
            <CardDescription>
              Organizer-created tournaments will appear here for public
              discovery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CalendarDaysIcon />
              <AlertTitle>
                {canCreateTournament
                  ? "Create the first tournament"
                  : "Nothing listed yet"}
              </AlertTitle>
              <AlertDescription>
                {canCreateTournament ? (
                  <>
                    Use{" "}
                    <Link
                      href="/dashboard/tournaments/new"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      the tournament form
                    </Link>{" "}
                    in your organizer dashboard to publish one here.
                  </>
                ) : (
                  "New public listings will show up when an organizer adds a tournament."
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tournaments.map((tournament) => (
            <TournamentSummaryCard
              key={tournament.id}
              tournament={{
                ...tournament,
                teamCount: tournament._count.teams,
                registeredPlayers: registeredPlayersFor(tournament.teams),
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
