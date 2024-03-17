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
    z.string().refine(
      (val) => {
        const allowedValues = Object.keys(charactersEnum.Values);

        // Check if the string starts with any of the allowed values
        return allowedValues.some((v) => val.startsWith(v));
      },
      {
        // Custom error message
        message: `String must start with one of the following values: ${Object.keys(
          charactersEnum.Values
        ).join(", ")}`,
      }
    )
  ),
  totalNumOfLines: z.number(),
});
