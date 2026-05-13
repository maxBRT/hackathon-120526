"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteTournamentById } from "@/server/actions/tournaments";
import {
  tournamentCreateSchema,
  tournamentUpdateSchema,
} from "@/lib/validations/tournament";

type TournamentFieldErrors = Partial<
  Record<
    "name" | "sport" | "city" | "startDate" | "entryFee" | "currency",
    string[]
  >
>;

export type TournamentActionState = {
  fieldErrors?: TournamentFieldErrors;
  formError?: string;
  values?: Record<string, string>;
};

export type DeleteTournamentActionState = {
  formError?: string;
};

const emptyTournamentState: TournamentActionState = {};
const emptyDeleteState: DeleteTournamentActionState = {};

function valueFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function tournamentFieldsFromForm(formData: FormData) {
  return {
    name: valueFromForm(formData, "name"),
    sport: valueFromForm(formData, "sport"),
    city: valueFromForm(formData, "city"),
    startDate: valueFromForm(formData, "startDate"),
    entryFee: valueFromForm(formData, "entryFee"),
    currency: valueFromForm(formData, "currency") || "CAD",
  };
}

function validationErrorState(values: Record<string, string>, fieldErrors: TournamentFieldErrors) {
  return {
    values,
    fieldErrors,
    formError: "Please fix the highlighted fields.",
  };
}

function revalidateTournamentPaths(tournamentId?: string) {
  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tournaments");

  if (tournamentId) {
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath(`/dashboard/tournaments/${tournamentId}/edit`);
  }
}

async function loadTournamentForOrganizer(tournamentId: string, organizerId: string, isAdmin: boolean) {
  return prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      ...(isAdmin ? {} : { organizerId }),
    },
    select: { id: true },
  });
}

export async function createTournament(
  previousState: TournamentActionState = emptyTournamentState,
  formData: FormData
): Promise<TournamentActionState> {
  void previousState;

  const user = await requireOrganizer();

  const values = tournamentFieldsFromForm(formData);
  const parsed = tournamentCreateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  let tournamentId: string;

  try {
    const tournament = await prisma.tournament.create({
      data: {
        ...parsed.data,
        organizerId: user.id,
      },
      select: {
        id: true,
      },
    });

    tournamentId = tournament.id;
  } catch {
    return {
      values,
      formError: "Unable to create the tournament. Please try again.",
    };
  }

  revalidateTournamentPaths(tournamentId);
  redirect("/dashboard/tournaments");
}

export async function updateTournament(
  tournamentId: string,
  previousState: TournamentActionState = emptyTournamentState,
  formData: FormData
): Promise<TournamentActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadTournamentForOrganizer(
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!existing) {
    return {
      formError: "You do not have access to update this tournament.",
    };
  }

  const values = tournamentFieldsFromForm(formData);
  const parsed = tournamentUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  try {
    await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: parsed.data,
    });
  } catch {
    return {
      values,
      formError: "Unable to update the tournament.",
    };
  }

  revalidateTournamentPaths(tournamentId);
  redirect("/dashboard/tournaments");
}

export async function deleteTournament(
  tournamentId: string,
  previousState: DeleteTournamentActionState = emptyDeleteState
): Promise<DeleteTournamentActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadTournamentForOrganizer(
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!existing) {
    return {
      formError: "You do not have access to delete this tournament.",
    };
  }

  try {
    await deleteTournamentById(tournamentId);
  } catch {
    return {
      formError: "Unable to delete this tournament.",
    };
  }

  revalidateTournamentPaths(tournamentId);
  redirect("/dashboard/tournaments");
}
