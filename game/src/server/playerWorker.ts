import { charactersEnum } from "../common/gameStateSchema";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: turnAndStateSchema,
  output: z.object({
    from: charactersEnum,
    line: z.string(),
  }),
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const { whoseTurn, state } of input) {
      const response = await genPrompt(whoseTurn, state);
      await output.emit({
        from: whoseTurn,
        line: parseJSONResponse(response) || "...",
      });
    }
  },
});

const DIRECTIVE_BY_ROLE = {
  morgan:
    "You are a conversation writing assistant for a video game.  Your job is play the role of our main character, Morgan. Morgan is prudent, courageous but could slip into self doubt from time to time. Write what Morgan should say next based on the context provided. ",
  jeremy:
    "You are a conversation writing assistant for a video game. Your job is play the role of a supporting character Jeremy. Jeremy has a sarcastic streak but deep down he's kind and helpful. Write what Jeremy should say next based on the context provided.",
};

async function genPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const context = `${DIRECTIVE_BY_ROLE[role]}

${genContext(state)}
  
### INSTRUCTIONS
- Write the next line based on PLOT SUMMARY.
- Response with JSON { "nextMessage": "[your message]" }
- Replace [your message] with what the player should say next.
- DO NOT repeat what's already in the CONVERSATION HISTORY. 
- Write only the JSON and nothing else.
- Avoid being too agreeable, predictable and repetitive. Insert drama, personality and conflict when appropriate.
- Keep the response under 20 words.
  `;
  const response = await generateResponseOllama(context);
  return response;
}
function genContext(state: GameState) {
  const { current, previous, recentHistory } = state;
  return `${
    (previous &&
      `### PREVIOUS SCENE
    Previously: ${previous.summary}`) ||
    ""
  }
  
  ### CURRENT SCENE
  PLOT SUMMARY: ${current.summary}
  
  ### CONVERSATION HISTORY
  ${
    recentHistory.length > 0
      ? recentHistory.join("\n")
      : "No conversation history yet."
  }`;
}
function parseJSONResponse(raw: string | null) {
  if (!raw) return null;
  try {
    // heuristic to find the {} enclosure substring
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const responseJsonString = raw.slice(start, end);
    const responseJson = JSON.parse(responseJsonString) as
      | {
          nextMessage: string;
        }
      | {
          ended: true;
        };
    if ((responseJson as { ended: true }).ended) {
      // console.log("PLAYER WORKER RESPONSE", response);
      return "[The human player has decided to quit the conversation.]";
    } else {
      return (
        responseJson as {
          nextMessage: string;
        }
      ).nextMessage;
    }
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return null;
  }
}
