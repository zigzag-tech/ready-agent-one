import { z } from "zod";

export const gameStateSchema = z.object({
  previous: z.object({
    summary: z.string(),
  }),
  current: z.object({
    summary: z.string(),
  }),
  recentHistory: z.array(
    z.string().refine(
      (val) => {
        // Check if the string starts with "Human Player:" or "NPC:"
        return val.startsWith("Human Player:") || val.startsWith("NPC:");
      },
      {
        // Custom error message
        message: "String must start with 'Human Player:' or 'NPC:'",
      }
    )
  ),
  totalNumOfLines: z.number(),
});
