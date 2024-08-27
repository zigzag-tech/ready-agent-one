import { JobSpec } from "@livestack/core";
import {
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
    supervision: gameStateSchema.extend({ releaseChange: z.boolean() }),
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
      },
      sceneNumber: 1,
      recentHistory: [],
      totalNumOfLines: 0,
    };

    for await (const { data, tag } of input.merge("character", "supervision")) {
      switch (tag) {
        case "supervision": {
          if (data.releaseChange) {
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
          const cleanState = _.omit(currentState, ["releaseChange"]);
          await output.emit(cleanState as z.infer<typeof gameStateSchema>);
          break;
        }

        default:
          throw new Error("Invalid tag");
      }
    }
  },
});
