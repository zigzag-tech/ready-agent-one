import { z } from "zod";
import { charactersEnum, actionSchema } from "./gameStateSchema";
export const characterOutputSchema = actionSchema.extend({
  subject: charactersEnum,
  thinking: z.string(),
  message: z.string(),
});
