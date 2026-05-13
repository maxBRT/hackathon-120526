"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSignedInUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { getStripe } from "@/lib/stripe";
import { tournamentEntryFeeToStripeUnitAmount } from "@/lib/stripe-pricing";
import { joinRequestFormSchema } from "@/lib/validations/join-request";

export type JoinRequestActionState = {
  fieldErrors?: {
    message?: string[];
  };
  formError?: string;
  success?: boolean;
  successMessage?: string;
  values?: Record<string, string>;
};

const emptyState: JoinRequestActionState = {};

function valueFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationErrorState(values: Record<string, string>, fieldErrors: JoinRequestActionState["fieldErrors"]) {
  return {
    values,
    fieldErrors,
    formError: "Please fix the highlighted fields.",
  };
}

function revalidateJoinPaths(tournamentId: string, teamId: string) {
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/teams/${teamId}`);
  revalidatePath("/my-requests");
}

export async function createJoinRequest(
  tournamentId: string,
  teamId: string,
  previousState: JoinRequestActionState = emptyState,
  formData: FormData
): Promise<JoinRequestActionState> {
  void previousState;

  const user = await requireSignedInUser();

  const values = {
    message: valueFromForm(formData, "message"),
  };

  const parsed = joinRequestFormSchema.safeParse(values);
  if (!parsed.success) {
    return validationErrorState(values, parsed.error.flatten().fieldErrors);
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tournamentId,
    },
    include: {
      tournament: true,
      members: { select: { id: true } },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!team) {
    return {
      ...values,
      formError: "This team was not found for this tournament.",
    };
  }

  const memberIds = new Set(team.members.map((m) => m.id));
  if (memberIds.has(user.id)) {
    return {
      ...values,
      formError: "You are already on this team.",
    };
  }

  if (team._count.members >= team.maxCapacity) {
    return {
      ...values,
      formError: "This team is full.",
    };
  }

  const existing = await prisma.joinRequest.findUnique({
    where: {
      playerId_teamId: {
        playerId: user.id,
        teamId,
      },
    },
  });

  if (existing?.status === "PENDING") {
    return {
      ...values,
      formError: "You already have a pending request for this team.",
    };
  }

  if (existing?.status === "ACCEPTED") {
    return {
      ...values,
      formError: "Your join request was already accepted.",
    };
  }

  const isFree = team.tournament.entryFee === 0;
  const paymentStatus = isFree ? ("NOT_REQUIRED" as const) : ("PENDING" as const);

  let joinRequestId: string;

  if (existing?.status === "REJECTED") {
    const updated = await prisma.joinRequest.update({
      where: {
        playerId_teamId: {
          playerId: user.id,
          teamId,
        },
      },
      data: {
        status: "PENDING",
        message: parsed.data.message,
        paymentStatus,
        stripeSessionId: null,
        paidAt: null,
      },
    });
    joinRequestId = updated.id;
  } else {
    const created = await prisma.joinRequest.create({
      data: {
        playerId: user.id,
        teamId,
        status: "PENDING",
        message: parsed.data.message,
        paymentStatus,
      },
    });
    joinRequestId = created.id;
  }

  if (!isFree) {
    const baseUrl = getPublicAppUrl();
    const tournament = team.tournament;
    let checkoutSessionUrl: string;

    try {
      const stripe = getStripe();
      const unitAmount = tournamentEntryFeeToStripeUnitAmount(
        tournament.entryFee,
        tournament.currency
      );
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        metadata: { joinRequestId },
        success_url: `${baseUrl}/payment/success`,
        cancel_url: `${baseUrl}/payment/cancel`,
        line_items: [
          {
            price_data: {
              currency: tournament.currency.toLowerCase(),
              unit_amount: unitAmount,
              product_data: {
                name: `${tournament.name} · team entry`,
              },
            },
            quantity: 1,
          },
        ],
      });

      if (!session.url) {
        return {
          ...values,
          formError: "Checkout could not be started. Please try again.",
        };
      }

      checkoutSessionUrl = session.url;

      await prisma.joinRequest.update({
        where: { id: joinRequestId },
        data: { stripeSessionId: session.id },
      });
    } catch {
      return {
        ...values,
        formError: "Checkout could not be started. Please try again.",
      };
    }

    revalidateJoinPaths(tournamentId, teamId);
    redirect(checkoutSessionUrl);
  }

  revalidateJoinPaths(tournamentId, teamId);

  return {
    success: true,
    successMessage: "Your join request was sent.",
    values: { message: "" },
  };
}

export async function cancelJoinRequest(formData: FormData): Promise<void> {
  const rawId = formData.get("joinRequestId");
  const joinRequestId = typeof rawId === "string" ? rawId.trim() : "";
  if (!joinRequestId) {
    return;
  }

  const user = await requireSignedInUser();

  const row = await prisma.joinRequest.findFirst({
    where: {
      id: joinRequestId,
      playerId: user.id,
      status: "PENDING",
    },
    select: {
      teamId: true,
      team: { select: { tournamentId: true } },
    },
  });

  if (!row) {
    return;
  }

  await prisma.joinRequest.delete({
    where: { id: joinRequestId },
  });

  revalidateJoinPaths(row.team.tournamentId, row.teamId);
  redirect("/my-requests");
}
