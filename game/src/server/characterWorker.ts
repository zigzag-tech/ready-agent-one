import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";
import {
  genActionPrompt,
  genActionChoicesPrompt,
  extractAllTaggedContent,
} from "./genPromptUtils";
import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import _ from "lodash";
import {
  characterOutputSchema,
  userChoicesSchema,
} from "../common/characterOutputSchema";
import {
  extractRawActionContent,
  parseRawContentToJSON,
} from "./genPromptUtils";

// TODO:
// 1. let LLM generate actions (maybe from a set of basic actions)
// 2. Try an entirely different scenario

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: {
    default: turnAndStateSchema,
    "user-choice": z.string(),
  },
  output: {
    default: characterOutputSchema,
    "action-prompt": z.any(),
    "needs-user-choice": userChoicesSchema,
  },
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    // const rl = readline.createInterface({ input:stdin, output:stdout });
    for await (const { whoseTurn, state } of input("default")) {
      if (whoseTurn === "morgan") {
        // generate 3 responses with LLM
        // send a NEEDS_USER_CHOICE output
        // wait on USER_CHOICE input
        // emit output

        const choicePrompt = genActionChoicesPrompt(whoseTurn, state);
        const rawMessage = await generateResponseOllamaByMessages(choicePrompt);
        if (!rawMessage) {
          throw new Error("Ollama response is empty.");
        }
        const rawContents = extractAllTaggedContent({
          input: rawMessage,
          startTag: "<choice>",
          endTag: "</choice>",
        });
        const choices = rawContents.map(
          (rawContent) =>
            parseRawContentToJSON(rawContent) as z.infer<
              typeof characterOutputSchema
            > & { label: string }
        );
        // console.log("needs-user-choice", choices);
        await output("needs-user-choice").emit({
          choices, criteria: state.current.criteria
        });
        const userChoice = await input("user-choice").nextValue();

        const json = choices.find((c) => c.label === userChoice) || choices[0];
        json.subject = whoseTurn;
        const jsonWithoutLabel = _.omit(json, "label");

        await output("default").emit(jsonWithoutLabel);
      } else {
        const actionPrompt = genActionPrompt(whoseTurn, state);
        // console.log(`${JSON.stringify(actionPrompt, null, 2)}`);
        await output("action-prompt").emit(actionPrompt);
        // const response = await generateResponseOllamaByMessages(actionPrompt);
        // if (!response) {
        //   throw new Error("No response from LLM");
        // }
        // const r = parseJSONResponse(response);
        const rawMessage = await generateResponseOllamaByMessages(actionPrompt);
        if (!rawMessage) {
          throw new Error("Ollama response is empty.");
        }
        const rawContent = extractRawActionContent(rawMessage);
        const json = parseRawContentToJSON(rawContent) as z.infer<
          typeof characterOutputSchema
        >;
        json.subject = whoseTurn;
        // const withoutReason = _.omit(r, "reason");

        await output("default").emit(json);
      }
    }
  },
});
