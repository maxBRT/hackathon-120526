"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useActionState } from "react";

import type { JoinRequestActionState } from "@/app/tournaments/[id]/teams/[teamId]/actions";
import { createJoinRequest } from "@/app/tournaments/[id]/teams/[teamId]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type JoinTeamSectionProps = {
  tournamentId: string;
  teamId: string;
  tournamentName: string;
  teamName: string;
  joinRedirectUrl: string;
  signedIn: boolean;
  statusBlock?: "member" | "pending" | "accepted" | "full";
};

function blockMessage(statusBlock: JoinTeamSectionProps["statusBlock"]): string | null {
  switch (statusBlock) {
    case "member":
      return "You are already on this team.";
    case "pending":
      return "You already have a pending join request for this team.";
    case "accepted":
      return "Your join request has been accepted.";
    case "full":
      return "This team is full.";
    default:
      return null;
  }
}

const initialState: JoinRequestActionState = {};

function fieldError(state: JoinRequestActionState, field: "message") {
  return state.fieldErrors?.[field]?.[0];
}

export function JoinTeamSection({
  tournamentId,
  teamId,
  tournamentName,
  teamName,
  joinRedirectUrl,
  signedIn,
  statusBlock,
}: JoinTeamSectionProps) {
  const boundCreate = createJoinRequest.bind(null, tournamentId, teamId);
  const [state, formAction, isPending] = useActionState(boundCreate, initialState);

  const blockCopy = blockMessage(statusBlock);

  if (!signedIn) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Join this team</CardTitle>
          <CardDescription>
            Sign in to send a join request for{" "}
            <span className="font-medium text-foreground">{teamName}</span> in{" "}
            <span className="font-medium text-foreground">{tournamentName}</span>.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <SignInButton forceRedirectUrl={joinRedirectUrl}>
            <button type="button" className={buttonVariants({ variant: "default" })}>
              Sign in to join
            </button>
          </SignInButton>
          <Link href={`/tournaments/${tournamentId}`} className={buttonVariants({ variant: "outline" })}>
            Back to tournament
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Join this team</CardTitle>
        <CardDescription>
          Optional message for the organizer. Team{" "}
          <span className="font-medium text-foreground">{teamName}</span>, tournament{" "}
          <span className="font-medium text-foreground">{tournamentName}</span>.
        </CardDescription>
      </CardHeader>
      {blockCopy ? (
        <CardContent className="pb-6">
          <Alert role="status">
            <AlertTitle>Cannot send a new request</AlertTitle>
            <AlertDescription>{blockCopy}</AlertDescription>
          </Alert>
          <Link href="/my-requests" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
            View my requests
          </Link>
        </CardContent>
      ) : (
        <form action={formAction}>
          <CardContent className="space-y-5 pb-6">
            {state.success && state.successMessage ? (
              <Alert role="status">
                <AlertTitle>Request saved</AlertTitle>
                <AlertDescription>{state.successMessage}</AlertDescription>
              </Alert>
            ) : null}

            {state.formError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to send request</AlertTitle>
                <AlertDescription>{state.formError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="join-message">Message (optional)</Label>
              <textarea
                key={state.success ? `sent:${state.successMessage ?? ""}` : "compose"}
                id="join-message"
                name="message"
                rows={4}
                defaultValue={state.values?.message ?? ""}
                aria-invalid={Boolean(fieldError(state, "message")) || undefined}
                className={cn(
                  "flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                )}
                placeholder="Tell the organizer why you want to join."
              />
              {fieldError(state, "message") ? (
                <p className="text-sm text-destructive">{fieldError(state, "message")}</p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send join request"}
            </Button>
            <Link href={`/tournaments/${tournamentId}`} className={buttonVariants({ variant: "outline" })}>
              Back to tournament
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
