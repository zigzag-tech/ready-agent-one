import { z } from "zod";
import { JobSpec } from "@livestack/core";
import { gameStateSchema } from "../common/gameStateSchema";

export const turnAndStateSchema = z.object({
  whoseTurn: z.enum(["human", "npc"]),
  state: gameStateSchema,
});
export const turnControlSpec = JobSpec.define({
  name: "TURN_CONTROL",
  input: gameStateSchema,
  output: turnAndStateSchema,
});

export const turnControl = turnControlSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const state of input) {
      const whoseTurn = state.totalNumOfLines % 2 === 0 ? "human" : "npc";
      await output.emit({
        whoseTurn,
        state,
      });
    }
  },
});
