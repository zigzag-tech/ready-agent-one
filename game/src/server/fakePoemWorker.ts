import ollama from "ollama";
import { POEM_SPEC_NAME } from "../common/game";
import { z } from "zod";
import { sleep } from ".";

const poemSpec = JobSpec.define({
  name: POEM_SPEC_NAME,
  // input: z.object({
  //   prompt: z.string(),
  // }),
  output: z.object({
    poem: z.string(),
  }),
});
export const fakePoemWorker = poemSpec.defineWorker({
  processor: async ({ output }) => {
    while (true) {
      const response = await ollama.chat({
        model: "mistral",
        messages: [
          {
            role: "user",
            content: `
            Write a two-line short poem, as an NPC character that cheers on  the action of the player.
            `,
          },
        ],
      });

      await output.emit({
        poem: response.message.content,
      });
      await sleep(5000);
    }
  },
});
