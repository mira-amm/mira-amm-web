import { z } from "zod";

export const getTaskRequestSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "'id' must be a numeric string")
    .transform((val) => Number.parseInt(val, 10))
    .refine((val) => val >= 1, "'id' must be a positive number"),
});

export type GetTaskRequest = z.infer<typeof getTaskRequestSchema>;
