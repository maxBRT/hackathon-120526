"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizer } from "@/lib/auth";
import prisma from "@/lib/prisma";

class OrganizerJoinRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "OrganizerJoinRequestError";
  }
}

function revalidateOrganizerJoinRequestPaths(tournamentId: string, teamId: string) {
  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/teams/${teamId}`);
  revalidatePath("/my-requests");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/tournaments");
  revalidatePath(`/dashboard/tournaments/${tournamentId}/teams`);
}

function joinRequestIdFromForm(formData: FormData) {
  const raw = formData.get("joinRequestId");
  return typeof raw === "string" ? raw.trim() : "";
}

function redirectWithJoinRequestError(code: string): never {
  redirect(`/dashboard/requests?error=${encodeURIComponent(code)}`);
}

export async function acceptJoinRequest(formData: FormData): Promise<void> {
  const user = await requireOrganizer();
  const joinRequestId = joinRequestIdFromForm(formData);
  if (!joinRequestId) {
    redirectWithJoinRequestError("missing_id");
  }

  const isAdmin = user.role === "ADMIN";

  let paths: { tournamentId: string; teamId: string };

  try {
    paths = await prisma.$transaction(async (tx) => {
      const row = await tx.joinRequest.findUnique({
        where: { id: joinRequestId },
        include: {
          team: {
            include: {
              tournament: true,
              members: { select: { id: true } },
            },
          },
        },
      });

      if (!row) {
        throw new OrganizerJoinRequestError("not_found");
      }

      const tournament = row.team.tournament;
      if (!isAdmin && tournament.organizerId !== user.id) {
        throw new OrganizerJoinRequestError("forbidden");
      }

      if (row.status !== "PENDING") {
        throw new OrganizerJoinRequestError("not_pending");
      }

      const paidRequired = tournament.entryFee > 0;
      if (paidRequired && row.paymentStatus !== "PAID") {
        throw new OrganizerJoinRequestError("payment_pending");
      }

      const memberIds = new Set(row.team.members.map((m) => m.id));
      if (memberIds.has(row.playerId)) {
        await tx.joinRequest.update({
          where: { id: row.id },
          data: { status: "ACCEPTED" },
        });
        return {
          tournamentId: row.team.tournamentId,
          teamId: row.teamId,
        };
      }

      if (row.team.members.length >= row.team.maxCapacity) {
        throw new OrganizerJoinRequestError("team_full");
      }

      await tx.team.update({
        where: { id: row.teamId },
        data: {
          members: { connect: { id: row.playerId } },
        },
      });

      await tx.joinRequest.update({
        where: { id: row.id },
        data: { status: "ACCEPTED" },
      });

      return {
        tournamentId: row.team.tournamentId,
        teamId: row.teamId,
      };
    });
  } catch (error) {
    if (error instanceof OrganizerJoinRequestError) {
      redirectWithJoinRequestError(error.code);
    }
    throw error;
  }

  revalidateOrganizerJoinRequestPaths(paths.tournamentId, paths.teamId);
  redirect("/dashboard/requests?success=accepted");
}

export async function rejectJoinRequest(formData: FormData): Promise<void> {
  const user = await requireOrganizer();
  const joinRequestId = joinRequestIdFromForm(formData);
  if (!joinRequestId) {
    redirectWithJoinRequestError("missing_id");
  }

  const isAdmin = user.role === "ADMIN";

  const row = await prisma.joinRequest.findFirst({
    where: {
      id: joinRequestId,
      status: "PENDING",
      ...(isAdmin ? {} : { team: { tournament: { organizerId: user.id } } }),
    },
    select: {
      team: {
        select: { id: true, tournamentId: true },
      },
    },
  });

  if (!row) {
    redirectWithJoinRequestError("reject_invalid");
  }

  await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: { status: "REJECTED" },
  });

  revalidateOrganizerJoinRequestPaths(row.team.tournamentId, row.team.id);
  redirect("/dashboard/requests?success=rejected");
}
