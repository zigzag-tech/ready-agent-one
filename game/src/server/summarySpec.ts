import { generateResponseOllama } from "./generateResponseOllama";
import pkg from "@livestack/core";
const { JobSpec } = pkg;
import { z } from "zod";

export const gameStateSchema = z.object({
  previous: z.object({
    summary: z.string(),
  }),
  current: z.object({
    summary: z.string(),
  }),
  recentHistory: z.array(
    z.string().refine(
      (val) => {
        // Check if the string starts with "Human Player:" or "NPC:"
        return val.startsWith("Human Player:") || val.startsWith("NPC:");
      },
      {
        // Custom error message
        message: "String must start with 'Human Player:' or 'NPC:'",
      }
    )
  ),
  totalNumOfLines: z.number(),
});

export type GameState = z.infer<typeof gameStateSchema>;

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: {
    npc: z.string(),
    player: z.string(),
    supervision: gameStateSchema,
  },
  output: gameStateSchema,
});
export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    let currentState: GameState = {
      previous: {
        summary: "",
      },
      current: {
        summary: "",
      },
      recentHistory: [],
      totalNumOfLines: 0,
    };

    for await (const { data, tag } of input.merge(
      "npc",
      "player",
      "supervision"
    )) {
      switch (tag) {
        case "supervision": {
          currentState = data;
          await output.emit(data);
          break;
        }
        case "npc":
        case "player": {
          const from = tag === "npc" ? "NPC" : "Human Player";
          currentState.recentHistory.push(`${from}: ${data}`);
          // keep accululating the history until it reaches 10
          // then take the oldest 5 and fold it into the summary
          if (currentState.recentHistory.length > 20) {
            const oldest = currentState.recentHistory.splice(0, 10);
            const prompt = `Summarize the previous summary and the recent conversation history into a single summary.
  SUMMARY OF PAST CONVERSATION:
  ${currentState.current.summary}
  RECENT CONVERSATION HISTORY:
  ${oldest.join("\n")}
  
  ### INSTRUCTIONS
  - Keep the response under 50 words.
`;
            currentState.current.summary = await generateResponseOllama(prompt);
          }
          // console.log(
          //   "SUMMARY WORKER OUTPUT",
          //   currentState.current.summary,
          //   currentState.recentHistory
          // );

          currentState.totalNumOfLines += 1;
          console.log(currentState);
          await output.emit(currentState);
          break;
        }

        default:
          throw new Error("Invalid tag");
      }
    }
  },
});
