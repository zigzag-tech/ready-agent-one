import { z } from "zod";
import { charactersEnum, actionSchema } from "./gameStateSchema";
export const characterOutputSchema = z.object({
  subject: charactersEnum,
  reflection: z.string(),
  //   intent: z.string(),
  actions: z.array(actionSchema),
});
