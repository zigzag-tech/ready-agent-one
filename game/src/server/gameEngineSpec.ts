import { JobSpec } from "@livestack/core";
import {
  Criteria,
  GameState,
  gameStateSchema,
  historyEntrySchema,
} from "../common/gameStateSchema";
import { genStateChangesByActions } from "./gameEngine";
import { characterOutputSchema } from "../common/characterOutputSchema";
import { z } from "zod";
import _ from "lodash";

export const gameEngineSpec = JobSpec.define({
  name: "GAME_ENGINE",
  input: {
    character: characterOutputSchema,
    supervision: gameStateSchema.extend({ stateHasChanged: z.boolean() }),
  },
  output: {
    default: gameStateSchema,
    "history-entries": historyEntrySchema,
  },
});
export const gameEngineWorker = gameEngineSpec.defineWorker({
  processor: async ({ input, output }) => {
    let currentState: GameState = {
      current: {
        summary: "",
        props: [],
        criteria: [],
      },
      sceneNumber: 1,
      recentHistory: [],
      totalNumOfLines: 0,
    };

    for await (const { data, tag } of input.merge("character", "supervision")) {
      switch (tag) {
        case "supervision": {
          if (data.stateHasChanged) {
            currentState = data;
          }
          break;
        }
        case "character": {
          const stateChanges = genStateChangesByActions(data, currentState);
          const historyEntry = {
            subject: data.subject,
            thinking: data.thinking,
            action: data.action,
            message: data.message,
            stateChanges,
          };
          currentState.recentHistory.push(historyEntry);
          await output("history-entries").emit(historyEntry);
          currentState.totalNumOfLines += 1;
          // console.clear();

          // transition to next scene if all criteria are met
          // const shouldTransitionToNextScene =
          //   currentState.current.criteria.every((criterion) =>
          //     isMet(criterion, currentState)
          //   );

          const cleanState = _.omit(currentState, ["stateHasChanged"]);
          await output.emit(cleanState as z.infer<typeof gameStateSchema>);
          break;
        }

        default:
          throw new Error("Invalid tag");
      }
    }
  },
});

// function isMet(criterion: Criteria, state: GameState) {
//   //TODO
// }