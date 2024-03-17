import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: turnAndStateSchema,
  output: z.object({
    from: z.enum(["npc", "human"]),
    line: z.string(),
  }),
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const { whoseTurn, state } of input) {
      const response = await genPrompt(whoseTurn, state);
      await output.emit({
        from: whoseTurn,
        line: parseJSONResponse(response),
      });
    }
  },
});

const LABEL_BY_ROLE = {
  human: "Human Player",
  npc: "NPC",
};
const DIRECTIVE_BY_ROLE = {
  human:
    "You are a conversation writing assistant. Your job is to write what the human player should say next based on the context provided.",
  npc: "You are a conversation writing assistant. Your job is play the role of an NPC named Jeremy with a sarcastic streak and write what Jeremy should say next based on the context provided. Try to be funny but helpful to the human player.",
};

async function genPrompt(role: "human" | "npc", state: GameState) {
  const context = `${DIRECTIVE_BY_ROLE[role]}
Below is a conversation that happened in an open world game. 

${genContext(state)}
  
### INSTRUCTIONS
- Response with JSON { "nextMessage": "[your message]" }
- Replace [your message] with what the player should say next.
- DO NOT repeat what's already in the CONVERSATION HISTORY. 
- Write only the JSON and nothing else.
- Keep the response under 20 words.
  `;
  const response = await generateResponseOllama(context);
  return response;
}
function genContext(state: GameState) {
  const { current, previous, recentHistory } = state;
  return `### PREVIOUS CHAPTER
  Previously: ${previous.summary}
  
  ### CURRENT CHAPTER
  What Happened so far:
  ${current.summary}
  
  ### CONVERSATION HISTORY
  ${
    recentHistory.length > 0
      ? recentHistory.join("\n")
      : "No conversation history yet."
  }`;
}
function parseJSONResponse(raw: string) {
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
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}
