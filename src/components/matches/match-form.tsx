"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { MatchActionState } from "@/app/dashboard/tournaments/[id]/matches/actions";
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
import { cn } from "@/lib/utils";

type MatchFormAction = (
  previousState: MatchActionState,
  formData: FormData
) => Promise<MatchActionState>;

type TeamOption = {
  id: string;
  name: string;
};

type MatchFormValues = {
  teamAId: string;
  teamBId: string;
  date: string;
  location: string;
  scoreA: string;
  scoreB: string;
};

type MatchFormProps = {
  title: string;
  description?: string;
  tournamentSummary: string;
  tournamentId: string;
  teams: TeamOption[];
  action: MatchFormAction;
  submitLabel: string;
  initialValues?: Partial<MatchFormValues>;
  variant?: "create" | "edit";
};

const initialState: MatchActionState = {};

function fieldError(state: MatchActionState, field: keyof MatchFormValues) {
  return state.fieldErrors?.[field]?.[0];
}

function valueFor(
  values: Record<string, string> | undefined,
  initialValues: Partial<MatchFormValues>,
  field: keyof MatchFormValues,
  fallback = ""
) {
  return values?.[field] ?? initialValues[field] ?? fallback;
}

export function MatchForm({
  title,
  description,
  tournamentSummary,
  tournamentId,
  teams,
  action,
  submitLabel,
  initialValues = {},
  variant = "create",
}: MatchFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values;
  const isCreate = variant === "create";
  const canSchedule = teams.length >= 2;

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
              <AlertTitle>Unable to save match</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          {!canSchedule ? (
            <Alert>
              <AlertTitle>Need at least two teams</AlertTitle>
              <AlertDescription>
                Create two teams for this tournament before scheduling a match.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teamAId">Team A</Label>
              <select
                id="teamAId"
                name="teamAId"
                required={canSchedule}
                disabled={!canSchedule}
                defaultValue={valueFor(values, initialValues, "teamAId")}
                aria-invalid={Boolean(fieldError(state, "teamAId")) || undefined}
                className={cn(
                  "border-input bg-background ring-offset-background flex h-8 w-full rounded-lg border px-2.5 text-sm",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  fieldError(state, "teamAId") && "border-destructive"
                )}
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {fieldError(state, "teamAId") ? (
                <p className="text-sm text-destructive">{fieldError(state, "teamAId")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamBId">Team B</Label>
              <select
                id="teamBId"
                name="teamBId"
                required={canSchedule}
                disabled={!canSchedule}
                defaultValue={valueFor(values, initialValues, "teamBId")}
                aria-invalid={Boolean(fieldError(state, "teamBId")) || undefined}
                className={cn(
                  "border-input bg-background ring-offset-background flex h-8 w-full rounded-lg border px-2.5 text-sm",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  fieldError(state, "teamBId") && "border-destructive"
                )}
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {fieldError(state, "teamBId") ? (
                <p className="text-sm text-destructive">{fieldError(state, "teamBId")}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="date">Date and time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                required={canSchedule}
                disabled={!canSchedule}
                defaultValue={valueFor(values, initialValues, "date")}
                aria-invalid={Boolean(fieldError(state, "date")) || undefined}
              />
              {fieldError(state, "date") ? (
                <p className="text-sm text-destructive">{fieldError(state, "date")}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                required={canSchedule}
                disabled={!canSchedule}
                defaultValue={valueFor(values, initialValues, "location")}
                placeholder="Field 3, Arena name"
                aria-invalid={Boolean(fieldError(state, "location")) || undefined}
              />
              {fieldError(state, "location") ? (
                <p className="text-sm text-destructive">{fieldError(state, "location")}</p>
              ) : null}
            </div>

            {!isCreate ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scoreA">Team A score (optional)</Label>
                  <Input
                    id="scoreA"
                    name="scoreA"
                    type="number"
                    min={0}
                    step={1}
                    disabled={!canSchedule}
                    defaultValue={valueFor(values, initialValues, "scoreA")}
                    aria-invalid={Boolean(fieldError(state, "scoreA")) || undefined}
                  />
                  {fieldError(state, "scoreA") ? (
                    <p className="text-sm text-destructive">
                      {fieldError(state, "scoreA")}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scoreB">Team B score (optional)</Label>
                  <Input
                    id="scoreB"
                    name="scoreB"
                    type="number"
                    min={0}
                    step={1}
                    disabled={!canSchedule}
                    defaultValue={valueFor(values, initialValues, "scoreB")}
                    aria-invalid={Boolean(fieldError(state, "scoreB")) || undefined}
                  />
                  {fieldError(state, "scoreB") ? (
                    <p className="text-sm text-destructive">
                      {fieldError(state, "scoreB")}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending || !canSchedule}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
          <Link
            href={`/dashboard/tournaments/${tournamentId}/matches`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
