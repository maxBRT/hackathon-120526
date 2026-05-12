import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatUserDisplayName } from "@/lib/format-user";

type TournamentSummaryCardProps = {
  tournament: {
    id: string;
    name: string;
    sport: string;
    city: string;
    startDate: Date;
    entryFee: number;
    currency: string;
    organizer?: {
      firstName: string;
      lastName: string;
    } | null;
    teamCount: number;
    registeredPlayers: number;
  };
  actions?: ReactNode;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatEntryFee(entryFee: number, currency: string) {
  if (entryFee === 0) {
    return "Free";
  }

  return `${entryFee} ${currency}`;
}

export function TournamentSummaryCard({
  tournament,
  actions,
}: TournamentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>
          {tournament.sport} in {tournament.city}
        </CardDescription>
        <CardAction>
          <Badge variant={tournament.entryFee > 0 ? "default" : "secondary"}>
            {formatEntryFee(tournament.entryFee, tournament.currency)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Start date</dt>
            <dd className="font-medium">
              {dateFormatter.format(tournament.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Teams</dt>
            <dd className="font-medium">{tournament.teamCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Players</dt>
            <dd className="font-medium">{tournament.registeredPlayers}</dd>
          </div>
        </dl>

        {tournament.organizer ? (
          <p className="text-sm text-muted-foreground">
            Organized by{" "}
            {formatUserDisplayName(
              tournament.organizer.firstName,
              tournament.organizer.lastName
            )}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tournaments/${tournament.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            View details
          </Link>
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
