import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { tournamentEntryFeeToStripeUnitAmount } from "@/lib/stripe-pricing";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Misconfigured server" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const joinRequestId = session.metadata?.joinRequestId?.trim();
  if (!joinRequestId) {
    console.error("checkout.session.completed missing metadata.joinRequestId");
    return NextResponse.json({ received: true });
  }

  const row = await prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: {
      team: { include: { tournament: true } },
    },
  });

  if (!row) {
    console.error("JoinRequest not found for webhook", joinRequestId);
    return NextResponse.json({ received: true });
  }

  if (row.paymentStatus !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  const tournament = row.team.tournament;
  const expectedUnit = tournamentEntryFeeToStripeUnitAmount(
    tournament.entryFee,
    tournament.currency
  );
  const sessionCurrency = (session.currency ?? "").toLowerCase();
  const tournamentCurrency = tournament.currency.toLowerCase();

  if (
    session.amount_total == null ||
    session.amount_total !== expectedUnit ||
    sessionCurrency !== tournamentCurrency
  ) {
    console.error("Checkout session amount or currency mismatch", {
      joinRequestId,
      expectedUnit,
      amount_total: session.amount_total,
      sessionCurrency,
      tournamentCurrency,
    });
    return NextResponse.json({ received: true });
  }

  await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
    },
  });

  const tournamentId = tournament.id;
  const teamId = row.teamId;
  revalidatePath("/my-requests");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/teams/${teamId}`);

  return NextResponse.json({ received: true });
}
