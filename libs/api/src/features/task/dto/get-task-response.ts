import {z} from "zod";

export const getTaskResponseSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

export type GetTaskResponse = z.infer<typeof getTaskResponseSchema>;
