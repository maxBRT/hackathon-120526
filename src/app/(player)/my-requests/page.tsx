import Link from "next/link";

import { cancelJoinRequest } from "@/app/tournaments/[id]/teams/[teamId]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { PaymentStatus, RequestStatus } from "@/generated/prisma/enums";
import { requireSignedInUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function requestStatusBadgeVariant(status: RequestStatus): "default" | "secondary" | "destructive" | "outline" {
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

function paymentStatusBadgeVariant(status: PaymentStatus): "default" | "secondary" | "destructive" | "outline" {
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

export default async function MyRequestsPage() {
  const user = await requireSignedInUser();

  const requests = await prisma.joinRequest.findMany({
    where: { playerId: user.id },
    include: {
      team: {
        include: {
          tournament: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Player</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My requests</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Join requests you have sent to teams, with status and payment state.
          </p>
        </div>
        <Link href="/tournaments" className="text-sm font-medium underline-offset-4 hover:underline">
          Browse tournaments
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no join requests yet. Open a tournament team page to send one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => {
                  const tournament = row.team.tournament;
                  const teamHref = `/tournaments/${tournament.id}/teams/${row.team.id}`;
                  const canCancel = row.status === "PENDING";

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{tournament.name}</TableCell>
                      <TableCell>
                        <Link href={teamHref} className="underline-offset-4 hover:underline">
                          {row.team.name}
                        </Link>
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
                        {canCancel ? (
                          <form action={cancelJoinRequest}>
                            <input type="hidden" name="joinRequestId" value={row.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Cancel request
                            </Button>
                          </form>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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
