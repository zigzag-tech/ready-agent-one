import { green } from "ansis";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";
import {
  Actions,
  genMessagePrompt,
  genActionPrompt as genActionPrompt,
  parseJSONResponse,
  characterInputSchema,
} from "./genPromptUtils";
import { actionSchema } from "../common/gameStateSchema";
import { generateResponseOllama } from "./generateResponseOllama";

// TODO:
// 1. let LLM generate actions (maybe from a set of basic actions)
// 2. Try an entirely different scenario

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: { default: turnAndStateSchema, "user-input": z.string().nullable() },
  output: {
    default: characterInputSchema,
    "user-signal": z.enum(["ENABLE", "DISABLE"]),
    "action-prompt": z.string(),
  },
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    // const rl = readline.createInterface({ input:stdin, output:stdout });
    for await (const { whoseTurn, state } of input("default")) {
      let actions: Actions | null = null;
      // if (whoseTurn === "morgan") {
      //   await output("user-signal").emit("ENABLE");
      //   line = await input("user-input").nextValue();
      //   await output("user-signal").emit("DISABLE");
      // }

      if (!actions) {
        const actionPrompt = genActionPrompt(whoseTurn, state);
        await output("action-prompt").emit(actionPrompt);
        const response = await generateResponseOllama(actionPrompt);

        actions = parseJSONResponse(response) || "...";
      }
      const message =
        (await genMessagePrompt(whoseTurn, state, actions)) ||
        "Sorry I don't know what to do.";

      await output("default").emit({
        from: whoseTurn,
        actions,
        message,
      });
    }
  },
});
