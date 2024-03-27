import { z } from "zod";
export const charactersEnum = z.enum(["morgan", "jeremy", "guy"]);
export const actionSchema = z.array(
  // z.union([
  //   z.object({ type: z.literal("talk"), message: z.string() }),
  //   z.object({ type: z.literal("walk"), destination: z.string() }),
  //   z.object({ type: z.literal("jump") }),
  // ])
  z.object({
    type: z.string(),
    target: z.string().optional(),
    destination: z.string().optional(),
    message: z.string().optional(),
  })
);

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
      actions: actionSchema,
    })
  ),
  totalNumOfLines: z.number(),
});
