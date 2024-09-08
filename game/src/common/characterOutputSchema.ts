import { z } from "zod";
import { charactersEnum, actionSchema } from "./gameStateSchema";
export const characterOutputSchema = actionSchema.extend({
  subject: charactersEnum,
  thinking: z.string(),
  message: z.string(),
});

export type CharacterOutput = z.infer<typeof characterOutputSchema>;

export const userChoicesSchema = z.array(
  characterOutputSchema.extend({ label: z.string() })
);
