import Link from "next/link";

import { acceptJoinRequest, rejectJoinRequest } from "@/app/dashboard/requests/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Level, PaymentStatus, RequestStatus } from "@/generated/prisma/enums";
import { requireOrganizer } from "@/lib/auth";
import { formatUserDisplayName } from "@/lib/format-user";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type JoinRequestsPageProps = {
  searchParams: Promise<{
    teamId?: string;
    error?: string;
    success?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function requestStatusLabel(status: RequestStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

function requestStatusBadgeVariant(
  status: RequestStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "ACCEPTED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "NOT_REQUIRED":
      return "Not required";
    case "PENDING":
      return "Pending";
    case "PAID":
      return "Paid";
    default:
      return status;
  }
}

function paymentStatusBadgeVariant(
  status: PaymentStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NOT_REQUIRED":
      return "outline";
    case "PENDING":
      return "secondary";
    case "PAID":
      return "default";
    default:
      return "outline";
  }
}

function levelLabel(level: Level) {
  switch (level) {
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return level;
  }
}

function errorAlertMessage(code: string) {
  switch (code) {
    case "missing_id":
      return "Missing request id. Try again.";
    case "not_found":
      return "That join request was not found.";
    case "forbidden":
      return "You cannot manage this request.";
    case "not_pending":
      return "This request is no longer pending.";
    case "payment_pending":
      return "Pay the entry fee before accepting this request.";
    case "team_full":
      return "This team is already at capacity.";
    case "reject_invalid":
      return "This request cannot be rejected. It may have been updated already.";
    default:
      return "Something went wrong. Try again.";
  }
}

export default async function DashboardJoinRequestsPage({ searchParams }: JoinRequestsPageProps) {
  const user = await requireOrganizer();
  const params = await searchParams;
  const teamIdFilter = params.teamId?.trim() ?? "";
  const errorCode = params.error?.trim();
  const success = params.success?.trim();

  const isAdmin = user.role === "ADMIN";

  const organizerTournamentFilter =
    isAdmin
      ? {}
      : {
          organizerId: user.id,
        };

  const [teamsForFilter, rawRequests] = await Promise.all([
    prisma.team.findMany({
      where: {
        tournament: organizerTournamentFilter,
      },
      include: {
        tournament: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ tournament: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.joinRequest.findMany({
      where: {
        team: {
          tournament: organizerTournamentFilter,
          ...(teamIdFilter ? { id: teamIdFilter } : {}),
        },
      },
      include: {
        player: {
          include: { playerProfile: true },
        },
        team: {
          include: {
            tournament: true,
            members: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const grouped = new Map<
    string,
    {
      tournament: (typeof rawRequests)[0]["team"]["tournament"];
      rows: typeof rawRequests;
    }
  >();

  for (const row of rawRequests) {
    const tid = row.team.tournament.id;
    const existing = grouped.get(tid);
    if (existing) {
      existing.rows.push(row);
    } else {
      grouped.set(tid, { tournament: row.team.tournament, rows: [row] });
    }
  }

  for (const value of grouped.values()) {
    value.rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const tournamentSections = [...grouped.values()].sort((a, b) =>
    a.tournament.name.localeCompare(b.tournament.name)
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Organizer dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Join requests</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Review and accept or reject join requests for tournaments you organize.
          </p>
        </div>
        <Link
          href="/dashboard/tournaments"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to tournaments
        </Link>
      </div>

      {success === "accepted" ? (
        <Alert>
          <AlertTitle>Request accepted</AlertTitle>
          <AlertDescription>The player was added to the team roster when applicable.</AlertDescription>
        </Alert>
      ) : null}

      {success === "rejected" ? (
        <Alert>
          <AlertTitle>Request rejected</AlertTitle>
          <AlertDescription>The join request was marked as rejected.</AlertDescription>
        </Alert>
      ) : null}

      {errorCode ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{errorAlertMessage(errorCode)}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Filter by team</CardTitle>
            <CardDescription>
              Limit the list to a single team, or show every request across your tournaments.
            </CardDescription>
          </div>
          <form action="/dashboard/requests" method="get" className="flex w-full max-w-md flex-col gap-2 sm:items-end">
            <Label htmlFor="team-filter" className="sr-only">
              Team
            </Label>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <select
                id="team-filter"
                name="teamId"
                defaultValue={teamIdFilter}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">All teams</option>
                {teamsForFilter.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.tournament.name} — {team.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" className="shrink-0">
                Apply
              </Button>
            </div>
            {teamIdFilter ? (
              <Link
                href="/dashboard/requests"
                className={buttonVariants({ variant: "link", className: "h-auto justify-end p-0 text-sm" })}
              >
                Clear filter
              </Link>
            ) : null}
          </form>
        </CardHeader>
      </Card>

      {tournamentSections.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No join requests</CardTitle>
            <CardDescription>
              {teamIdFilter
                ? "No requests match this filter."
                : "You have no join requests for your tournaments yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {tournamentSections.map(({ tournament, rows }) => (
            <details
              key={tournament.id}
              className="group border-border rounded-lg border"
            >
              <summary className="ring-offset-background focus-visible:ring-ring list-none cursor-pointer rounded-lg px-4 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-lg font-semibold">{tournament.name}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {tournament.sport} · {tournament.city}
                    </span>
                  </div>
                  <Badge variant="outline">{rows.length} request{rows.length === 1 ? "" : "s"}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Starts {dateFormatter.format(tournament.startDate)}
                </p>
              </summary>
              <div className="border-border border-t px-2 pb-4 sm:px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const profile = row.player.playerProfile;
                      const entryFee = row.team.tournament.entryFee;
                      const paidRequired = entryFee > 0;
                      const rosterSize = row.team.members.length;
                      const playerOnTeam = row.team.members.some((m) => m.id === row.playerId);
                      const atCapacity = rosterSize >= row.team.maxCapacity && !playerOnTeam;
                      const acceptBlocked =
                        row.status !== "PENDING" ||
                        (paidRequired && row.paymentStatus !== "PAID") ||
                        atCapacity;
                      const acceptReason =
                        row.status !== "PENDING"
                          ? ""
                          : paidRequired && row.paymentStatus !== "PAID"
                            ? "Payment required before acceptance."
                            : atCapacity
                              ? "Team is full."
                              : "";

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {formatUserDisplayName(row.player.firstName, row.player.lastName)}
                          </TableCell>
                          <TableCell className="max-w-[220px] text-sm whitespace-normal">
                            {profile ? (
                              <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                                <li>{profile.city}</li>
                                <li>{profile.favoriteSportId}</li>
                                <li>{levelLabel(profile.level)}</li>
                                {profile.position ? <li>{profile.position}</li> : null}
                              </ul>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{row.team.name}</TableCell>
                          <TableCell className="max-w-[200px] whitespace-normal">
                            {row.message?.trim() ? row.message : "—"}
                          </TableCell>
                          <TableCell>{dateFormatter.format(row.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant={requestStatusBadgeVariant(row.status)}>
                              {requestStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentStatusBadgeVariant(row.paymentStatus)}>
                              {paymentStatusLabel(row.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status === "PENDING" ? (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <form action={acceptJoinRequest}>
                                    <input type="hidden" name="joinRequestId" value={row.id} />
                                    <Button
                                      type="submit"
                                      size="sm"
                                      disabled={acceptBlocked}
                                      title={acceptReason}
                                    >
                                      Accept
                                    </Button>
                                  </form>
                                  <form action={rejectJoinRequest}>
                                    <input type="hidden" name="joinRequestId" value={row.id} />
                                    <Button type="submit" variant="outline" size="sm">
                                      Reject
                                    </Button>
                                  </form>
                                </div>
                                {acceptReason ? (
                                  <span className="text-muted-foreground max-w-[14rem] text-right text-xs">
                                    {acceptReason}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
