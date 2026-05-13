"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { matchCreateSchema, matchUpdateSchema } from "@/lib/validations/match";

type MatchFieldErrors = Partial<
  Record<
    | "teamAId"
    | "teamBId"
    | "date"
    | "location"
    | "scoreA"
    | "scoreB",
    string[]
  >
>;

export type MatchActionState = {
  fieldErrors?: MatchFieldErrors;
  formError?: string;
  values?: Record<string, string>;
};

export type DeleteMatchActionState = {
  formError?: string;
};

const emptyMatchState: MatchActionState = {};
const emptyDeleteState: DeleteMatchActionState = {};

function valueFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function matchCreateFieldsFromForm(formData: FormData) {
  return {
    teamAId: valueFromForm(formData, "teamAId"),
    teamBId: valueFromForm(formData, "teamBId"),
    date: valueFromForm(formData, "date"),
    location: valueFromForm(formData, "location"),
  };
}

function matchUpdateFieldsFromForm(formData: FormData) {
  return {
    ...matchCreateFieldsFromForm(formData),
    scoreA: valueFromForm(formData, "scoreA"),
    scoreB: valueFromForm(formData, "scoreB"),
  };
}

function validationErrorState(values: Record<string, string>, fieldErrors: MatchFieldErrors) {
  return {
    values,
    fieldErrors,
    formError: "Please fix the highlighted fields.",
  };
}

function revalidateMatchPaths(tournamentId: string, matchId?: string) {
  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath("/matches");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  revalidatePath(`/dashboard/tournaments/${tournamentId}/matches`);

  if (matchId) {
    revalidatePath(
      `/dashboard/tournaments/${tournamentId}/matches/${matchId}/edit`
    );
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

async function loadMatchForOrganizer(
  matchId: string,
  tournamentId: string,
  organizerId: string,
  isAdmin: boolean
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: { include: { tournament: { select: { organizerId: true } } } },
      teamB: { select: { tournamentId: true } },
    },
  });

  if (!match) {
    return null;
  }

  if (
    match.teamA.tournamentId !== tournamentId ||
    match.teamB.tournamentId !== tournamentId
  ) {
    return null;
  }

  if (!isAdmin && match.teamA.tournament.organizerId !== organizerId) {
    return null;
  }

  return match;
}

async function assertTeamsInTournament(
  tournamentId: string,
  teamAId: string,
  teamBId: string
) {
  const [teamA, teamB] = await Promise.all([
    prisma.team.findFirst({
      where: { id: teamAId, tournamentId },
      select: { id: true },
    }),
    prisma.team.findFirst({
      where: { id: teamBId, tournamentId },
      select: { id: true },
    }),
  ]);

  return Boolean(teamA && teamB);
}

export async function createMatch(
  tournamentId: string,
  previousState: MatchActionState = emptyMatchState,
  formData: FormData
): Promise<MatchActionState> {
  void previousState;

  const user = await requireOrganizer();

  const accessible = await loadTournamentForOrganizer(
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!accessible) {
    return {
      formError: "You do not have access to schedule matches for this tournament.",
    };
  }

  const values = matchCreateFieldsFromForm(formData);
  const parsed = matchCreateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  const teamsOk = await assertTeamsInTournament(
    tournamentId,
    parsed.data.teamAId,
    parsed.data.teamBId
  );

  if (!teamsOk) {
    return {
      ...validationErrorState(values, {
        teamAId: ["Teams must belong to this tournament."],
        teamBId: ["Teams must belong to this tournament."],
      }),
    };
  }

  try {
    await prisma.match.create({
      data: {
        teamAId: parsed.data.teamAId,
        teamBId: parsed.data.teamBId,
        date: parsed.data.date,
        location: parsed.data.location,
      },
    });
  } catch {
    return {
      values,
      formError: "Unable to create the match. Please try again.",
    };
  }

  revalidateMatchPaths(tournamentId);
  redirect(`/dashboard/tournaments/${tournamentId}/matches`);
}

export async function updateMatch(
  tournamentId: string,
  matchId: string,
  previousState: MatchActionState = emptyMatchState,
  formData: FormData
): Promise<MatchActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadMatchForOrganizer(
    matchId,
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!existing) {
    return {
      formError: "You do not have access to update this match.",
    };
  }

  const values = matchUpdateFieldsFromForm(formData);
  const parsed = matchUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  const teamsOk = await assertTeamsInTournament(
    tournamentId,
    parsed.data.teamAId,
    parsed.data.teamBId
  );

  if (!teamsOk) {
    return {
      ...validationErrorState(values, {
        teamAId: ["Teams must belong to this tournament."],
        teamBId: ["Teams must belong to this tournament."],
      }),
    };
  }

  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        teamAId: parsed.data.teamAId,
        teamBId: parsed.data.teamBId,
        date: parsed.data.date,
        location: parsed.data.location,
        scoreA: parsed.data.scoreA,
        scoreB: parsed.data.scoreB,
      },
    });
  } catch {
    return {
      values,
      formError: "Unable to update the match.",
    };
  }

  revalidateMatchPaths(tournamentId, matchId);
  redirect(`/dashboard/tournaments/${tournamentId}/matches`);
}

export async function deleteMatch(
  tournamentId: string,
  matchId: string,
  previousState: DeleteMatchActionState = emptyDeleteState
): Promise<DeleteMatchActionState> {
  void previousState;

  const user = await requireOrganizer();

  const existing = await loadMatchForOrganizer(
    matchId,
    tournamentId,
    user.id,
    user.role === "ADMIN"
  );

  if (!existing) {
    return {
      formError: "You do not have access to delete this match.",
    };
  }

  try {
    await prisma.match.delete({
      where: { id: matchId },
    });
  } catch {
    return {
      formError: "Unable to delete the match.",
    };
  }

  revalidateMatchPaths(tournamentId);
  redirect(`/dashboard/tournaments/${tournamentId}/matches`);
}
