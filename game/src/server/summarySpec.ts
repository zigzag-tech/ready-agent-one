import { generateResponseOllama } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { z } from "zod";
import { gameStateSchema } from "../common/gameStateSchema";
import { characterOutputSchema } from "./genPromptUtils";

export type GameState = z.infer<typeof gameStateSchema>;

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: {
    character: characterOutputSchema,
    supervision: gameStateSchema,
  },
  output: gameStateSchema,
});
export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    let currentState: GameState = {
      current: {
        summary: "",
        props: [],
      },
      sceneNumber: 1,
      recentHistory: [],
      totalNumOfLines: 0,
    };

    for await (const { data, tag } of input.merge("character", "supervision")) {
      switch (tag) {
        case "supervision": {
          currentState = data;
          break;
        }
        case "character": {
          const { actions, subject, intent, reflection } = data;
          currentState.recentHistory.push({
            subject,
            reflection,
            intent,
            actions,
          });
          const SUMMARIZE_THRESHOLD = 9;
          // keep accululating the history until it reaches 10
          // then take the oldest 5 and fold it into the summary
          if (currentState.recentHistory.length > SUMMARIZE_THRESHOLD * 2) {
            const oldest = currentState.recentHistory.splice(
              0,
              Math.round(SUMMARIZE_THRESHOLD)
            );
            const prompt = `Summarize the previous summary and the recent conversation history into a single summary.
  SUMMARY OF PAST CONVERSATION:
  ${currentState.current.summary}
  RECENT CONVERSATION HISTORY:
  ${oldest.join("\n")}
  
  ### INSTRUCTIONS
  - Keep the response under 50 words.
`;

            currentState.current.summary =
              (await generateResponseOllama(prompt)) || "";
          }
          // console.log(
          //   "SUMMARY WORKER OUTPUT",
          //   currentState.current.summary,
          //   currentState.recentHistory
          // );

          currentState.totalNumOfLines += 1;
          // console.clear();
          console.log({
            ...currentState,
            recentHistory: currentState.recentHistory.map(
              (h) => `${h.subject}: ${JSON.stringify(h.actions)};`
            ),
          });
          await output.emit(currentState);
          break;
        }

        default:
          throw new Error("Invalid tag");
      }
    }
  },
});
