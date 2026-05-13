"use client";

import { useActionState } from "react";
import { Trash2Icon } from "lucide-react";

import {
  deleteMatch,
  type DeleteMatchActionState,
} from "@/app/dashboard/tournaments/[id]/matches/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DeleteMatchButtonProps = {
  tournamentId: string;
  matchId: string;
  label: string;
};

const initialState: DeleteMatchActionState = {};

export function DeleteMatchButton({
  tournamentId,
  matchId,
  label,
}: DeleteMatchButtonProps) {
  const [state, formAction, isPending] = useActionState(
    deleteMatch.bind(null, tournamentId, matchId),
    initialState
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this match?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes {label} from the schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.formError ? (
          <Alert variant="destructive">
            <AlertDescription>{state.formError}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete match"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
