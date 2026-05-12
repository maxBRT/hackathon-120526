"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { teamCreateSchema, teamUpdateSchema } from "@/lib/validations/team";

type TeamFieldErrors = Partial<Record<"name" | "maxCapacity", string[]>>;

export type TeamActionState = {
  fieldErrors?: TeamFieldErrors;
  formError?: string;
  values?: Record<string, string>;
};

export type DeleteTeamActionState = {
  formError?: string;
};

const emptyTeamState: TeamActionState = {};
const emptyDeleteState: DeleteTeamActionState = {};

function valueFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function teamFieldsFromForm(formData: FormData) {
  return {
    name: valueFromForm(formData, "name"),
    maxCapacity: valueFromForm(formData, "maxCapacity"),
  };
}

function validationErrorState(values: Record<string, string>, fieldErrors: TeamFieldErrors) {
  return {
    values,
    fieldErrors,
    formError: "Please fix the highlighted fields.",
  };
}

function revalidateTeamPaths(tournamentId: string, teamId?: string) {
  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  revalidatePath(`/dashboard/tournaments/${tournamentId}/teams`);

  if (teamId) {
    revalidatePath(`/dashboard/tournaments/${tournamentId}/teams/${teamId}/edit`);
  }
}

async function loadTournamentForOrganizer(
  tournamentId: string,
  organizerId: string,
  isAdmin: boolean
) {
  return prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      ...(isAdmin ? {} : { organizerId }),
    },
    select: { id: true },
  });
}

async function loadTeamForOrganizer(
  teamId: string,
  tournamentId: string,
  organizerId: string,
  isAdmin: boolean
) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
      ...(isAdmin ? {} : { tournament: { organizerId } }),
    },
    select: {
      id: true,
      _count: {
        select: { members: true },
      },
    },
  });
}

export async function createTeam(
  tournamentId: string,
  previousState: TeamActionState = emptyTeamState,
  formData: FormData
): Promise<TeamActionState> {
  void previousState;

  const user = await requireOrganizer();

  const accessible = await loadTournamentForOrganizer(
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!accessible) {
    return {
      formError: "You do not have access to create teams for this tournament.",
    };
  }

  const values = teamFieldsFromForm(formData);
  const parsed = teamCreateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    await prisma.team.create({
      data: {
        name: parsed.data.name,
        maxCapacity: parsed.data.maxCapacity,
        tournamentId,
      },
    });
  } catch {
    return {
      values,
      formError: "Unable to create the team. Please try again.",
    };
  }

  revalidateTeamPaths(tournamentId);
  redirect(`/dashboard/tournaments/${tournamentId}/teams`);
}

export async function updateTeam(
  tournamentId: string,
  teamId: string,
  previousState: TeamActionState = emptyTeamState,
  formData: FormData
): Promise<TeamActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadTeamForOrganizer(teamId, tournamentId, user.id, user.role === "ADMIN");

  if (!existing) {
    return {
      formError: "You do not have access to update this team.",
    };
  }

  const values = teamFieldsFromForm(formData);
  const parsed = teamUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.maxCapacity < existing._count.members) {
    return {
      ...validationErrorState(values, {
        maxCapacity: [
          `Capacity cannot be lower than the current roster (${existing._count.members} players).`,
        ],
      }),
    };
  }

  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        name: parsed.data.name,
        maxCapacity: parsed.data.maxCapacity,
      },
    });
  } catch {
    return {
      values,
      formError: "Unable to update the team.",
    };
  }

  revalidateTeamPaths(tournamentId, teamId);
  redirect(`/dashboard/tournaments/${tournamentId}/teams`);
}

export async function deleteTeam(
  tournamentId: string,
  teamId: string,
  previousState: DeleteTeamActionState = emptyDeleteState
): Promise<DeleteTeamActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadTeamForOrganizer(teamId, tournamentId, user.id, user.role === "ADMIN");

  if (!existing) {
    return {
      formError: "You do not have access to delete this team.",
    };
  }

  if (existing._count.members > 0) {
    return {
      formError:
        "This team still has registered players. Remove all players before deleting the team.",
    };
  }

  try {
    await prisma.team.delete({
      where: { id: teamId },
    });
  } catch {
    return {
      formError: "Unable to delete the team.",
    };
  }

  revalidateTeamPaths(tournamentId);
  redirect(`/dashboard/tournaments/${tournamentId}/teams`);
}
