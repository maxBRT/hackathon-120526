"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { deleteTournamentById, deleteTeamById, changeUserRole } from "@/server/actions/tournaments";

export async function deleteTournamentAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("tournamentId");
  if (!id || typeof id !== "string") {
    throw new Error("missing id");
  }
  await deleteTournamentById(id);
  revalidatePath("/admin");
}

export async function deleteTeamAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("teamId");
  if (!id || typeof id !== "string") {
    throw new Error("missing id");
  }
  await deleteTeamById(id);
  revalidatePath("/admin");
}

export async function changeUserRoleAction(formData: FormData) {
  await requireRole("ADMIN");
  const userId = formData.get("userId");
  const role = formData.get("role");
  if (!userId || typeof userId !== "string") throw new Error("missing userId");
  if (!role || typeof role !== "string") throw new Error("missing role");
  await changeUserRole(userId, role);
  revalidatePath("/admin");
}
