import { z } from "zod";
import { JobSpec } from "@livestack/core";
import { charactersEnum, gameStateSchema } from "../common/gameStateSchema";
import _ from "lodash";

export const turnAndStateSchema = z.object({
  whoseTurn: charactersEnum,
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
      const cleanState = _.omit(state, ["releaseChange"]);
      const op = charactersEnum.options;
      const whoseTurn = op[state.totalNumOfLines % op.length];
      await output.emit({
        whoseTurn,
        state: cleanState as z.infer<typeof gameStateSchema>,
      });
    }
  },
});
