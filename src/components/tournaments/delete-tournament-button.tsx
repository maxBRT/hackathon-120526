"use client";

import { useActionState } from "react";
import { Trash2Icon } from "lucide-react";

import {
  deleteTournament,
  type DeleteTournamentActionState,
} from "@/app/dashboard/tournaments/actions";
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

type DeleteTournamentButtonProps = {
  tournamentId: string;
  tournamentName: string;
};

const initialState: DeleteTournamentActionState = {};

export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
}: DeleteTournamentButtonProps) {
  const [state, formAction, isPending] = useActionState(
    deleteTournament.bind(null, tournamentId),
    initialState
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {tournamentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the tournament and all teams and players
            registered for it.
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
              {isPending ? "Deleting..." : "Delete tournament"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
