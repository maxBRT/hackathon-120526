import { z } from "zod";

export const joinRequestFormSchema = z.object({
  message: z
    .string()
    .trim()
    .max(500, "Message must be 500 characters or less")
    .transform((v) => (v === "" ? undefined : v)),
});
