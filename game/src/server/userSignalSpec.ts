import { JobSpec } from "@livestack/core";
import { gameStateSchema } from "../common/gameStateSchema";
import { z } from "zod";

export const userSignalSpec = JobSpec.define({
  name: "USER_SIGNAL_WORKER",
  input: { default: gameStateSchema, "user-signal": z.string() },
  output: { default: gameStateSchema, "needs-user-signal": z.string() },
});
export const userSignalWorker = userSignalSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const currentState of input) {
      await output("needs-user-signal").emit("waiting");
      const userSignal = await input("user-signal").nextValue();
      if (userSignal) {
        await output.emit(currentState);
      }
    }
  },
});
