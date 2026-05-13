import { z } from "zod";

const requiredText = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(200, `${field} must be 200 characters or less`);

const datetimeFromInput = z
  .string()
  .min(1, "Date and time are required")
  .transform((value, context) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Date and time must be valid",
      });

      return z.NEVER;
    }

    return date;
  });

const teamPairSchema = z.object({
  teamAId: z.string().trim().min(1, "Team A is required"),
  teamBId: z.string().trim().min(1, "Team B is required"),
  date: datetimeFromInput,
  location: requiredText("Location"),
});

export const matchCreateSchema = teamPairSchema.refine(
  (data) => data.teamAId !== data.teamBId,
  {
    message: "Team A and Team B must be different",
    path: ["teamBId"],
  }
);

const optionalScoreFromForm = z.preprocess((val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  return val;
}, z.union([z.null(), z.coerce.number().int().min(0, "Score must be zero or greater")]));

export const matchUpdateSchema = teamPairSchema
  .extend({
    scoreA: optionalScoreFromForm,
    scoreB: optionalScoreFromForm,
  })
  .refine((data) => data.teamAId !== data.teamBId, {
    message: "Team A and Team B must be different",
    path: ["teamBId"],
  });
