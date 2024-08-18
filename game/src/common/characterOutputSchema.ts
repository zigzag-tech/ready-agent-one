import { z } from "zod";
import { charactersEnum, actionSchema } from "./gameStateSchema";
export const characterOutputSchema = actionSchema.extend({
  subject: charactersEnum,
  thinking: z.string(),
  message: z.string(),
});

export const userChoicesSchema = z.array(
  characterOutputSchema.extend({ label: z.string() })
);
