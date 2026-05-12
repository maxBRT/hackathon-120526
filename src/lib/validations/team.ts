import { z } from "zod";

const requiredText = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(120, `${field} must be 120 characters or less`);

const maxCapacitySchema = z.coerce
  .number()
  .int("Max capacity must be a whole number")
  .min(1, "Max capacity must be at least 1")
  .max(200, "Max capacity cannot exceed 200");

const teamFieldsSchema = z.object({
  name: requiredText("Team name"),
  maxCapacity: maxCapacitySchema,
});

export const teamCreateSchema = teamFieldsSchema;
export const teamUpdateSchema = teamFieldsSchema;
