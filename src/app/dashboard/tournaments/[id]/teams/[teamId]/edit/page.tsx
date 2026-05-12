import { notFound } from "next/navigation";

import { updateTeam } from "@/app/dashboard/tournaments/[id]/teams/actions";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import { TeamForm } from "@/components/teams/team-form";
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
import { requireOrganizer } from "@/lib/auth";
import { formatUserDisplayName } from "@/lib/format-user";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditTeamPageProps = {
  params: Promise<{
    id: string;
    teamId: string;
  }>;
};

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id: tournamentId, teamId } = await params;

  const user = await requireOrganizer();

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
      ...(user.role === "ADMIN" ? {} : { tournament: { organizerId: user.id } }),
    },
    include: {
      tournament: true,
      members: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const tournamentSummary = `${team.tournament.name} · ${team.tournament.sport} · ${team.tournament.city}`;
  const updateTeamBound = updateTeam.bind(null, tournamentId, team.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organizer dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Edit team
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Roster{" "}
            <span className="font-medium text-foreground">
              {team._count.members} / {team.maxCapacity}
            </span>{" "}
            players · Tournament{" "}
            <span className="font-medium text-foreground">
              {team.tournament.name}
            </span>
          </p>
        </div>
        <DeleteTeamButton
          tournamentId={tournamentId}
          teamId={team.id}
          teamName={team.name}
          memberCount={team._count.members}
        />
      </div>

      <TeamForm
        variant="edit"
        title={team.name}
        tournamentSummary={tournamentSummary}
        tournamentId={tournamentId}
        action={updateTeamBound}
        submitLabel="Save changes"
        initialValues={{
          name: team.name,
          maxCapacity: String(team.maxCapacity),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Current players</CardTitle>
          <CardDescription>
            Players registered on this team ({team.members.length} of{" "}
            {team.maxCapacity} spots filled).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No players yet. Players appear here once they join this team.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {formatUserDisplayName(member.firstName, member.lastName)}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
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
