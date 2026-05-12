"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { TeamActionState } from "@/app/dashboard/tournaments/[id]/teams/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TeamFormAction = (
  previousState: TeamActionState,
  formData: FormData
) => Promise<TeamActionState>;

type TeamFormValues = {
  name: string;
  maxCapacity: string;
};

type TeamFormProps = {
  title: string;
  description?: string;
  tournamentSummary: string;
  tournamentId: string;
  action: TeamFormAction;
  submitLabel: string;
  initialValues?: Partial<TeamFormValues>;
  variant?: "create" | "edit";
};

const initialState: TeamActionState = {};

function fieldError(state: TeamActionState, field: keyof TeamFormValues) {
  return state.fieldErrors?.[field]?.[0];
}

function valueFor(
  values: Record<string, string> | undefined,
  initialValues: Partial<TeamFormValues>,
  field: keyof TeamFormValues,
  fallback = ""
) {
  return values?.[field] ?? initialValues[field] ?? fallback;
}

export function TeamForm({
  title,
  description,
  tournamentSummary,
  tournamentId,
  action,
  submitLabel,
  initialValues = {},
  variant = "create",
}: TeamFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values;
  const isCreate = variant === "create";

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && isCreate ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
        <CardDescription>
          Tournament:{" "}
          <span className="font-medium text-foreground">{tournamentSummary}</span>
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5 pb-6">
          {state.formError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to save team</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={valueFor(values, initialValues, "name")}
                aria-invalid={Boolean(fieldError(state, "name")) || undefined}
                placeholder="Northside Crushers"
              />
              {fieldError(state, "name") ? (
                <p className="text-sm text-destructive">{fieldError(state, "name")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Max capacity</Label>
              <Input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                max="200"
                step="1"
                defaultValue={valueFor(values, initialValues, "maxCapacity", "15")}
                aria-invalid={
                  Boolean(fieldError(state, "maxCapacity")) || undefined
                }
              />
              {fieldError(state, "maxCapacity") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "maxCapacity")}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Maximum number of players who can join this team (1–200).
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
          <Link
            href={`/dashboard/tournaments/${tournamentId}/teams`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
