import Link from "next/link";
import { notFound } from "next/navigation";

import { JoinTeamSection } from "@/components/join-requests/join-team-section";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUserDisplayName } from "@/lib/format-user";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TeamDetailPageProps = {
  params: Promise<{
    id: string;
    teamId: string;
  }>;
};

function formatEntryFee(entryFee: number, currency: string) {
  if (entryFee === 0) {
    return "Free";
  }

  return `${entryFee} ${currency}`;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id: tournamentId, teamId } = await params;

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
    },
    include: {
      tournament: {
        include: {
          organizer: true,
        },
      },
      members: {
        select: { id: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const user = await getCurrentUser();

  const joinRequest =
    user &&
    (await prisma.joinRequest.findUnique({
      where: {
        playerId_teamId: {
          playerId: user.id,
          teamId,
        },
      },
    }));

  let statusBlock: "member" | "pending" | "accepted" | "full" | undefined;

  if (user && team.members.some((m) => m.id === user.id)) {
    statusBlock = "member";
  } else if (joinRequest?.status === "PENDING") {
    statusBlock = "pending";
  } else if (joinRequest?.status === "ACCEPTED") {
    statusBlock = "accepted";
  } else if (team._count.members >= team.maxCapacity) {
    statusBlock = "full";
  }

  const joinRedirectUrl = `/tournaments/${tournamentId}/teams/${teamId}`;
  const tournament = team.tournament;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <Link href="/tournaments" className="underline-offset-4 hover:underline">
              Tournaments
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <Link
              href={`/tournaments/${tournamentId}`}
              className="underline-offset-4 hover:underline"
            >
              {tournament.name}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{team.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {tournament.sport} in {tournament.city}. Organizer{" "}
            {formatUserDisplayName(
              tournament.organizer.firstName,
              tournament.organizer.lastName
            )}
            .
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
            <CardDescription>{dateFormatter.format(tournament.startDate)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              {team._count.members} / {team.maxCapacity} players
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tournament</CardTitle>
            <CardDescription className="line-clamp-2">{tournament.name}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <JoinTeamSection
        tournamentId={tournamentId}
        teamId={teamId}
        tournamentName={tournament.name}
        teamName={team.name}
        joinRedirectUrl={joinRedirectUrl}
        signedIn={Boolean(user)}
        statusBlock={statusBlock}
      />
    </main>
  );
}
