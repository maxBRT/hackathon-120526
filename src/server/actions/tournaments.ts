import prisma from "@/lib/prisma";

export async function deleteTournamentById(id: string) {
  return prisma.tournament.delete({ where: { id } });
}

export async function deleteTeamById(id: string) {
  return prisma.team.delete({ where: { id } });
}

export async function changeUserRole(userId: string, role: string) {
  return prisma.user.update({ where: { id: userId }, data: { role: role as any } });
}

export async function getAllTournamentsWithTeamsAndMembers() {
  return prisma.tournament.findMany({
    include: {
      teams: {
        include: {
          members: true,
          joinRequests: { where: { status: "PENDING" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
