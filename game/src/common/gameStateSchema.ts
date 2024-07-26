import { z } from "zod";
const objectState = z.string();
// const locationSchema = z.object({ x: z.number(), y: z.number() });
const locationSchema = z.string();
const objectStateChangeSchema = z.object({
  subject: z.string(),
  type: z.literal("status"),
  fromState: objectState,
  toState: objectState,
});
const objectLocationChangeSchema = z.object({
  subject: z.string(),
  type: z.literal("location"),
  fromLocation: locationSchema,
  toLocation: locationSchema,
});

export const stateEventSchema = z.union([
  objectStateChangeSchema,
  objectLocationChangeSchema,
]);

export const charactersEnum = z.string();
export const actionSchema = z.object({
  action: z.string(),
  target: z.string().optional().nullable(),
  // message: z.string().optional().nullable(),
  // destination: locationSchema.optional().nullable(),
});

export const historyEntrySchema = actionSchema.extend({
  subject: z.string(),
  thinking: z.string(),
  message: z.string(),
  stateChanges: z.array(stateEventSchema),
});

export const thoughtSchema = z.object({
  thought: z.string(),
  // intent: z.string().nullable().optional(),
});

export const scenePropsSchema = z.array(
  z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    position: locationSchema.optional().nullable(),
    // front-end only:
    // moving: z.boolean().optional(),
    // rolling: z.boolean().optional(),
    // current_position: z
    //   .object({
    //     x: z.number(),
    //     y: z.number(),
    //   })
    //   .optional(),
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
  recentHistory: z.array(historyEntrySchema),
  totalNumOfLines: z.number(),
});

export type GameState = z.infer<typeof gameStateSchema>;
