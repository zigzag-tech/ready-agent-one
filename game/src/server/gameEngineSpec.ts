import { JobSpec } from "@livestack/core";
import {
  GameState,
  gameStateSchema,
  historyEntrySchema,
} from "../common/gameStateSchema";
import { genStateChangesByActions } from "./gameEngine";
import { characterOutputSchema } from "../common/characterOutputSchema";

export const gameEngineSpec = JobSpec.define({
  name: "GAME_ENGINE",
  input: {
    character: characterOutputSchema,
    supervision: gameStateSchema,
  },
  output: {
    default: gameStateSchema,
    "history-entries": historyEntrySchema,
  },
});
export const summaryWorker = gameEngineSpec.defineWorker({
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
          const { actions, subject, reflection } = data;
          const stateChanges = genStateChangesByActions(data, currentState);
          const historyEntry = {
            subject,
            reflection,
            // intent,
            actions,
            stateChanges,
          };
          currentState.recentHistory.push(historyEntry);
          await output("history-entries").emit(historyEntry);
          currentState.totalNumOfLines += 1;
          // console.clear();
          await output.emit(currentState);
          break;
        }

        default:
          throw new Error("Invalid tag");
      }
    }
  },
});
