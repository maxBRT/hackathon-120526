import { z } from "zod";

const requiredText = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(120, `${field} must be 120 characters or less`);

const dateFromInput = z
  .string()
  .min(1, "Start date is required")
  .transform((value, context) => {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Start date must be a valid date",
      });

      return z.NEVER;
    }

    return date;
  });

const tournamentFieldsSchema = z.object({
  name: requiredText("Name"),
  sport: requiredText("Sport"),
  city: requiredText("City"),
  startDate: dateFromInput,
  entryFee: z.coerce
    .number()
    .int("Entry fee must be a whole number")
    .min(0, "Entry fee cannot be negative"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .default("CAD")
    .pipe(
      z
        .string()
        .length(3, "Currency must be a 3-letter code")
        .regex(/^[A-Z]+$/, "Currency must use letters only")
    ),
});

export const tournamentCreateSchema = tournamentFieldsSchema;
export const tournamentUpdateSchema = tournamentFieldsSchema;
