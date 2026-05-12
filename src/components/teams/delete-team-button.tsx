"use client";

import { useActionState } from "react";
import { Trash2Icon } from "lucide-react";

import {
  deleteTeam,
  type DeleteTeamActionState,
} from "@/app/dashboard/tournaments/[id]/teams/actions";
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

type DeleteTeamButtonProps = {
  tournamentId: string;
  teamId: string;
  teamName: string;
  memberCount: number;
};

const initialState: DeleteTeamActionState = {};

export function DeleteTeamButton({
  tournamentId,
  teamId,
  teamName,
  memberCount,
}: DeleteTeamButtonProps) {
  const [state, formAction, isPending] = useActionState(
    deleteTeam.bind(null, tournamentId, teamId),
    initialState
  );

  if (memberCount > 0) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button type="button" variant="destructive" disabled>
          <Trash2Icon />
          Delete
        </Button>
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          Remove all players before deleting this team ({memberCount} registered).
        </p>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {teamName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the team. You can only delete teams with no
            registered players.
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
              {isPending ? "Deleting..." : "Delete team"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
