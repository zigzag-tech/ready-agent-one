import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { GameState, gameStateSchema } from "../common/gameStateSchema";
import { Message } from "ollama";
import { genStateChangesByActions } from "./gameEngine";
import { characterOutputSchema } from "../common/characterOutputSchema";

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: gameStateSchema,
  output: gameStateSchema,
});
export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const currentState of input) {
      currentState.totalNumOfLines += 1;
      // console.clear();
      await output.emit(currentState);
    }
  },
});
