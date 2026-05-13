import { z } from "zod";
import { Level } from "@/generated/prisma/enums";

const requiredText = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(120, `${field} must be 120 characters or less`);

export const playerProfileUpdateSchema = z.object({
  firstName: requiredText("First name"),
  lastName: requiredText("Last name"),
  city: requiredText("City"),
  favoriteSportId: z.string().min(1, "Favorite sport is required"),
  level: z.enum(Level),
  position: z
    .string()
    .trim()
    .max(120, "Preferred position must be 120 characters or less")
    .optional(),
});
