import { generateResponseOllama } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { z } from "zod";
import { gameStateSchema } from "../common/gameStateSchema";

export type GameState = z.infer<typeof gameStateSchema>;

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: {
    character: z.object({
      from: z.enum(["npc", "human"]),
      line: z.string(),
    }),
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

    for await (const { data, tag } of input.merge("character", "supervision")) {
      switch (tag) {
        case "supervision": {
          currentState = data;
          await output.emit(data);
          break;
        }
        case "character": {
          const { line, from } = data;
          const label = from === "npc" ? "NPC" : "Human Player";
          currentState.recentHistory.push(`${label}: ${line}`);
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
