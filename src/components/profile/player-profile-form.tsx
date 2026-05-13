"use client";

import { useActionState } from "react";

import type { UpdatePlayerProfileActionState } from "@/server/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type PlayerProfileFormAction = (
  previousState: UpdatePlayerProfileActionState,
  formData: FormData
) => Promise<UpdatePlayerProfileActionState>;

type PlayerProfileFormValues = {
  firstName: string;
  lastName: string;
  city: string;
  favoriteSportId: string;
  level: string;
  position: string;
};

type SportOption = { id: string; name: string };

type PlayerProfileFormProps = {
  action: PlayerProfileFormAction;
  initialValues: PlayerProfileFormValues;
  sports: SportOption[];
};

const initialState: UpdatePlayerProfileActionState = {};

const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

function fieldError(
  state: UpdatePlayerProfileActionState,
  field: keyof PlayerProfileFormValues
) {
  return state.fieldErrors?.[field]?.[0];
}

function valueFor(
  values: Record<string, string> | undefined,
  initialValues: PlayerProfileFormValues,
  field: keyof PlayerProfileFormValues
) {
  return values?.[field] ?? initialValues[field];
}

function levelLabel(level: string) {
  switch (level) {
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return level;
  }
}

export function PlayerProfileForm({ action, initialValues, sports }: PlayerProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const values = state.values;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Player profile</CardTitle>
        <CardDescription>
          Keep your profile up to date so teams and organizers can understand your
          playing preferences.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5">
          {state.formError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to save profile</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          {state.successMessage ? (
            <Alert>
              <AlertTitle>Profile saved</AlertTitle>
              <AlertDescription>{state.successMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={valueFor(values, initialValues, "firstName")}
                aria-invalid={Boolean(fieldError(state, "firstName")) || undefined}
              />
              {fieldError(state, "firstName") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "firstName")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={valueFor(values, initialValues, "lastName")}
                aria-invalid={Boolean(fieldError(state, "lastName")) || undefined}
              />
              {fieldError(state, "lastName") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "lastName")}
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
                <p className="text-sm text-destructive">{fieldError(state, "city")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteSport">Favorite sport</Label>
              {(() => {
                const selectedSportId = valueFor(values, initialValues, "favoriteSportId");
                const selectedSport = sports.find(s => s.id === selectedSportId);
                return (
                  <Select
                    name="favoriteSportId"
                    defaultValue={selectedSportId}
                  >
                    <SelectTrigger
                      id="favoriteSportId"
                      className="w-full"
                      aria-invalid={Boolean(fieldError(state, "favoriteSportId")) || undefined}
                    >
                      <SelectValue placeholder="Select sport">
                        {selectedSport?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
              {fieldError(state, "favoriteSportId") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "favoriteSportId")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                name="level"
                defaultValue={valueFor(values, initialValues, "level")}
              >
                <SelectTrigger
                  id="level"
                  className="w-full"
                  aria-invalid={Boolean(fieldError(state, "level")) || undefined}
                >
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {levelLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError(state, "level") ? (
                <p className="text-sm text-destructive">{fieldError(state, "level")}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="position">Preferred position (optional)</Label>
              <Input
                id="position"
                name="position"
                defaultValue={valueFor(values, initialValues, "position")}
                aria-invalid={Boolean(fieldError(state, "position")) || undefined}
                placeholder="Wing, Goalkeeper, Setter..."
              />
              {fieldError(state, "position") ? (
                <p className="text-sm text-destructive">
                  {fieldError(state, "position")}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-8">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
