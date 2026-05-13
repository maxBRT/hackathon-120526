import Link from "next/link";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUsersPaginated } from "@/server/actions/users";
import { changeUserRoleAction } from "./actions";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatUserDisplayName } from "@/lib/format-user";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireRole("ADMIN");
  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1") || 1);
  const pageSize = 20;

  const [usersResult, tournaments] = await Promise.all([
    getUsersPaginated(q, page, pageSize),
    prisma.tournament.findMany({
      include: {
        teams: {
          include: {
            members: true,
            joinRequests: { where: { status: "PENDING" } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const users = usersResult.users;
  const userCount = usersResult.count;
  const currentPage = usersResult.page;
  const totalPages = usersResult.totalPages;
  const hasPreviousPage = usersResult.hasPreviousPage;
  const hasNextPage = usersResult.hasNextPage;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search users and change roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex items-center gap-2" action="/admin" method="get">
            <input name="q" placeholder="Search users by name or email" defaultValue={q} className="rounded border px-3 py-2 text-sm w-full" />
            <Button type="submit">Search</Button>
          </form>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{formatUserDisplayName(u.firstName, u.lastName)}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="text-right">
                      <form action={changeUserRoleAction} className="flex items-center gap-2 justify-end">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className="rounded border px-2 py-1 text-sm">
                          <option value="PLAYER">Player</option>
                          <option value="ORGANIZER">Organizer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <Button size="sm" type="submit">Change</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">
                {userCount} users{totalPages ? ` · page ${currentPage} of ${totalPages}` : ""}
              </div>
              <div className="flex gap-2">
                {hasPreviousPage ? (
                  <Link href={`/admin?q=${encodeURIComponent(q)}&page=${currentPage - 1}`} className="text-sm underline">Previous</Link>
                ) : null}
                {hasNextPage ? (
                  <Link href={`/admin?q=${encodeURIComponent(q)}&page=${currentPage + 1}`} className="text-sm underline">Next</Link>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>

        <CardHeader>
          <CardTitle>All tournaments</CardTitle>
          <CardDescription>View tournaments, teams and players. Export CSV or perform moderation actions.</CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.map((t) => (
            <div key={t.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <div className="text-sm text-muted-foreground">{t.sport} · {t.city}</div>
                </div>
                <div className="flex gap-2">
                  <DeleteTournamentButton tournamentId={t.id} tournamentName={t.name} />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Remaining spots</TableHead>
                    <TableHead>Pending requests</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.members.length}</TableCell>
                      <TableCell>{Math.max(0, team.maxCapacity - team.members.length)}</TableCell>
                      <TableCell>{team.joinRequests?.length ?? 0}</TableCell>
                      <TableCell>
                        <ul className="text-sm">
                          {team.members.map((m) => (
                            <li key={m.id} className="flex items-center justify-between gap-2">
                              <span>{formatUserDisplayName(m.firstName, m.lastName)}</span>
                              <form action={changeUserRoleAction} className="flex items-center gap-2">
                                <input type="hidden" name="userId" value={m.id} />
                                <select name="role" defaultValue={m.role} className="rounded border px-2 py-1 text-sm">
                                  <option value="PLAYER">Player</option>
                                  <option value="ORGANIZER">Organizer</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                                <Button size="sm" type="submit">Change</Button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <DeleteTeamButton
                            tournamentId={t.id}
                            teamId={team.id}
                            teamName={team.name}
                            memberCount={team.members.length}
                          />
                          <Link href={`/tournaments/${t.id}`} className="text-sm underline">View</Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <form action="/admin/export">
            <Button type="submit">Export CSV</Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
