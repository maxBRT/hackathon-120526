import Link from "next/link";
import { CalendarIcon } from "lucide-react";

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
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MatchesPageProps = {
  searchParams: Promise<{ when?: string }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function scoreCell(scoreA: number | null, scoreB: number | null) {
  if (scoreA != null && scoreB != null) {
    return `${scoreA} – ${scoreB}`;
  }
  return "—";
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const { when: whenRaw } = await searchParams;
  const when = whenRaw === "past" ? "past" : "upcoming";
  const now = new Date();

  const user = await getCurrentUser();

  const userTeamRows =
    user != null
      ? await prisma.team.findMany({
          where: { members: { some: { id: user.id } } },
          select: { id: true },
        })
      : [];

  const userTeamIds = new Set(userTeamRows.map((t) => t.id));
  const showMyMatches = userTeamIds.size > 0;

  const [upcomingPublic, myMatches] = await Promise.all([
    prisma.match.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      include: {
        teamA: {
          include: {
            tournament: {
              select: { id: true, name: true, city: true, sport: true },
            },
          },
        },
        teamB: { select: { name: true } },
      },
    }),
    showMyMatches && user
      ? prisma.match.findMany({
          where: {
            OR: [
              { teamA: { members: { some: { id: user.id } } } },
              { teamB: { members: { some: { id: user.id } } } },
            ],
            ...(when === "upcoming" ? { date: { gte: now } } : { date: { lt: now } }),
          },
          orderBy: { date: when === "upcoming" ? "asc" : "desc" },
          include: {
            teamA: {
              include: {
                tournament: {
                  select: { id: true, name: true, city: true, sport: true },
                },
              },
            },
            teamB: { select: { id: true, name: true } },
          },
        })
      : [],
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Matches</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Browse upcoming games across tournaments.
        </p>
      </div>

      {showMyMatches ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>My matches</CardTitle>
                <CardDescription>Games for teams you belong to.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/matches?when=upcoming"
                  className={
                    when === "upcoming"
                      ? "ring-offset-background bg-secondary text-secondary-foreground inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium"
                      : "text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium underline-offset-4 hover:underline"
                  }
                >
                  Upcoming
                </Link>
                <Link
                  href="/matches?when=past"
                  className={
                    when === "past"
                      ? "ring-offset-background bg-secondary text-secondary-foreground inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium"
                      : "text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium underline-offset-4 hover:underline"
                  }
                >
                  Past
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {myMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {when === "upcoming"
                  ? "You have no upcoming matches."
                  : "No past matches yet."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myMatches.map((match) => {
                    const imTeamA = userTeamIds.has(match.teamAId);
                    const myTeamName = imTeamA ? match.teamA.name : match.teamB.name;
                    const opponentName = imTeamA ? match.teamB.name : match.teamA.name;

                    return (
                      <TableRow key={match.id}>
                        <TableCell className="whitespace-nowrap">
                          {dateTimeFormatter.format(match.date)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/tournaments/${match.teamA.tournament.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {match.teamA.tournament.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">{myTeamName}</span>
                          {" vs "}
                          <span className="font-medium">{opponentName}</span>
                        </TableCell>
                        <TableCell>{match.location}</TableCell>
                        <TableCell>{scoreCell(match.scoreA, match.scoreB)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            Upcoming matches
          </CardTitle>
          <CardDescription>All scheduled matches from now on.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingPublic.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming matches yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPublic.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="whitespace-nowrap">
                      {dateTimeFormatter.format(match.date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/tournaments/${match.teamA.tournament.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {match.teamA.tournament.name}
                      </Link>
                      <div className="text-muted-foreground text-sm">
                        {match.teamA.tournament.sport} · {match.teamA.tournament.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{match.teamA.name}</span>
                      {" vs "}
                      <span className="font-medium">{match.teamB.name}</span>
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
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
