import { z } from "zod";
export const charactersEnum = z.enum(["morgan", "jeremy", "guy"]);
export const actionSchema = z.array(
  z.object({
    action_type: z.string(),
    target: z.string().optional(),
    message: z.string().optional(),
  })
);
export const scenePropsSchema = z.array(
  z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    moving: z.boolean(),
    rolling: z.boolean(),
    current_position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    target_position: z.object({
      x: z.number(),
      y: z.number(),
    }),
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
    props: scenePropsSchema,
  }),
  recentHistory: z.array(
    z.object({
      subject: z.string(),
      reflection: z.string(),
      intent: z.string(),
      actions: actionSchema,
      reason: z.string().optional(),
    })
  ),
  totalNumOfLines: z.number(),
});
