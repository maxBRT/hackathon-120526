import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">
          Tournament platform
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Browse and manage tournaments
        </h1>
        <p className="mt-4 text-muted-foreground">
          Browse tournaments without signing in. Organizer tools live in the
          dashboard and require a signed-in organizer or admin account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Public tournaments</CardTitle>
            <CardDescription>
              Browse tournament details, entry fees, teams, and player counts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/tournaments"
              className={buttonVariants({ variant: "default" })}
            >
              View tournaments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizer dashboard</CardTitle>
            <CardDescription>
              Sign in as an organizer or admin to create and edit tournaments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/tournaments"
              className={buttonVariants({ variant: "outline" })}
            >
              Manage tournaments
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
