"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { TournamentActionState } from "@/app/dashboard/tournaments/actions";
import { formatUserDisplayName } from "@/lib/format-user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TournamentFormAction = (
  previousState: TournamentActionState,
  formData: FormData
) => Promise<TournamentActionState>;

type TournamentFormValues = {
  name: string;
  sport: string;
  city: string;
  startDate: string;
  entryFee: string;
  currency: string;
};

type TournamentFormProps = {
  title: string;
  description?: string;
  action: TournamentFormAction;
  submitLabel: string;
  initialValues?: Partial<TournamentFormValues>;
  variant?: "create" | "edit";
  organizerSummary?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  sports?: { id: string; name: string }[];
};

const initialState: TournamentActionState = {};

const currencies = ["CAD", "USD", "EUR"];

function fieldError(state: TournamentActionState, field: keyof TournamentFormValues) {
  return state.fieldErrors?.[field]?.[0];
}

function valueFor(
  values: Record<string, string> | undefined,
  initialValues: Partial<TournamentFormValues>,
  field: keyof TournamentFormValues,
  fallback = ""
) {
  return values?.[field] ?? initialValues[field] ?? fallback;
}

export function TournamentForm({
  title,
  description,
  action,
  submitLabel,
  initialValues = {},
  variant = "create",
  organizerSummary,
  sports = [],
}: TournamentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values;
  const isCreate = variant === "create";
  const selectedCurrency = valueFor(values, initialValues, "currency", "CAD");

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && isCreate ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
        {!isCreate && organizerSummary ? (
          <CardDescription>
            Organizer{" "}
            <span className="font-medium text-foreground">
              {formatUserDisplayName(
                organizerSummary.firstName,
                organizerSummary.lastName
              )}
            </span>{" "}
            ({organizerSummary.email}) — cannot be changed here.
          </CardDescription>
        ) : null}
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5">
          {state.formError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to save tournament</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={valueFor(values, initialValues, "name")}
                aria-invalid={Boolean(fieldError(state, "name")) || undefined}
                placeholder="Downtown Spring Cup"
              />
              {fieldError(state, "name") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "name")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              {sports && sports.length > 0 ? (
                <>
                  <Select name="sport" defaultValue={valueFor(values, initialValues, "sport")}>
                    <SelectTrigger id="sport" className="w-full" aria-invalid={Boolean(fieldError(state, "sport")) || undefined}>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Input
                    id="sport"
                    name="sport"
                    defaultValue={valueFor(values, initialValues, "sport")}
                    aria-invalid={Boolean(fieldError(state, "sport")) || undefined}
                    placeholder="Basketball"
                  />
                </>
              )}
              {fieldError(state, "sport") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "sport")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={valueFor(values, initialValues, "city")}
                aria-invalid={Boolean(fieldError(state, "city")) || undefined}
                placeholder="Montreal"
              />
              {fieldError(state, "city") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "city")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={valueFor(values, initialValues, "startDate")}
                aria-invalid={
                  Boolean(fieldError(state, "startDate")) || undefined
                }
              />
              {fieldError(state, "startDate") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "startDate")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry fee</Label>
              <Input
                id="entryFee"
                name="entryFee"
                type="number"
                min="0"
                step="1"
                defaultValue={valueFor(values, initialValues, "entryFee", "0")}
                aria-invalid={
                  Boolean(fieldError(state, "entryFee")) || undefined
                }
              />
              {fieldError(state, "entryFee") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "entryFee")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={selectedCurrency}>
                <SelectTrigger
                  id="currency"
                  className="w-full"
                  aria-invalid={
                    Boolean(fieldError(state, "currency")) || undefined
                  }
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError(state, "currency") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "currency")}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
          <Link
            href="/dashboard/tournaments"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
