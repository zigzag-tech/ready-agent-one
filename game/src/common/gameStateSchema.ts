import { z } from "zod";
export const charactersEnum = z.enum(["morgan", "jeremy"]);

export const gameStateSchema = z.object({
  previous: z
    .object({
      summary: z.string(),
    })
    .optional(),
  sceneNumber: z.number(),
  current: z.object({
    summary: z.string(),
  }),
  recentHistory: z.array(
    z.object({
      speaker: charactersEnum,
      message: z.string(),
    })
  ),
  totalNumOfLines: z.number(),
});
