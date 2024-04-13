import { z } from "zod";
export const charactersEnum = z.enum(["morgan", "jeremy", "guy"]);
export const actionSchema = z.array(
  z.object({
    type: z.string(),
    target: z.string().optional(),
    destination: z.string().optional(),
    // Apr-2 experiment - moving message to a separate attribute
    // message: z.string().optional(),
  })
);
export const scenePropsSchema = z.array(
  z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    position: z.string(),
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
      character: z.string(),
      actions: actionSchema,
      message: z.string(),
    })
  ),
  totalNumOfLines: z.number(),
});
