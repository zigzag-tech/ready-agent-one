import { green } from "ansis";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";
import { genActionPrompt, parseJSONResponse } from "./genPromptUtils";
import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import _ from "lodash";
import { characterOutputSchema } from "../common/characterOutputSchema";

// TODO:
// 1. let LLM generate actions (maybe from a set of basic actions)
// 2. Try an entirely different scenario

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: { default: turnAndStateSchema, "user-input": z.string().nullable() },
  output: {
    default: characterOutputSchema,
    "user-signal": z.enum(["ENABLE", "DISABLE"]),
    "action-prompt": z.any(),
  },
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    // const rl = readline.createInterface({ input:stdin, output:stdout });
    for await (const { whoseTurn, state } of input("default")) {
      // if (whoseTurn === "morgan") {
      //   await output("user-signal").emit("ENABLE");
      //   line = await input("user-input").nextValue();
      //   await output("user-signal").emit("DISABLE");
      // }

      const actionPrompt = genActionPrompt(whoseTurn, state);
      await output("action-prompt").emit(actionPrompt);
      const response = await generateResponseOllamaByMessages(actionPrompt);
      if (!response) {
        throw new Error("No response from LLM");
      }
      const r = parseJSONResponse(response);
      // const withoutReason = _.omit(r, "reason");

      await output("default").emit(r);
    }
  },
});
