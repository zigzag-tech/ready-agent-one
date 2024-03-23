import { charactersEnum } from "../common/gameStateSchema";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";

export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: { default: turnAndStateSchema, "user-input": z.string().nullable() },
  output: {
    default: z.object({
      from: charactersEnum,
      line: z.string(),
    }),
    "user-signal": z.enum(["ENABLE", "DISABLE"]),
  },
});

export const characterWorker = characterSpec.defineWorker({
  processor: async ({ input, output }) => {
    // const rl = readline.createInterface({ input:stdin, output:stdout });
    for await (const { whoseTurn, state } of input("default")) {
      let line: string | null = null;
      if (whoseTurn === "morgan") {
        await output("user-signal").emit("ENABLE");
        line = await input("user-input").nextValue();
        await output("user-signal").emit("DISABLE");
      }

      if (!line) {
        const response = await genPrompt(whoseTurn, state);
        line = parseJSONResponse(response) || "...";
      }

      await output("default").emit({
        from: whoseTurn,
        line,
      });
    }
  },
});

const DIRECTIVE_BY_ROLE = {
  morgan:
    "You are a conversation writing assistant for a video game. Your job is play the role of our main character, Morgan. Morgan is prudent, courageous but could slip into self doubt from time to time. Write what Morgan should say next based on the context provided. ",
  jeremy:
    "You are a conversation writing assistant for a video game. Your job is play the role of a supporting character Jeremy. Jeremy has a sarcastic streak but deep down he's kind and helpful. Write what Jeremy should say next based on the context provided.",
  guy:
  "You are a conversation writing assistant for a video game. Your job is play the role of a supporting character Guy. Guy is tring to acting helpful but he always messes things up. Write what Guy should say next based on the context provided."
};

async function genPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const context = `<s>[INST]${DIRECTIVE_BY_ROLE[role]}
  
### INSTRUCTIONS
- Keep the response in line with the PLOT SUMMARY provided and the CONVERSATION HISTORY.
- DO NOT repeat what's already said in the CONVERSATION HISTORY. 
- This is real life conversation, so be colloquial and natural.
- Write only the JSON and nothing else.
- Avoid being too agreeable, predictable and repetitive. Insert drama, personality and conflict when appropriate.
- Keep the response short, under 20 words.
- Response with JSON { "speaker": "${role}", "nextMessage": "[character message]" }, replace [character message] with what the player should say next.

For instance, the following:
WORLD DEFINITION:
${JSON.stringify({
  previous: {
    summary:
      "In a fantasy world, three warriors are about to face a dragon. They went out to find the dragon to save their village.",
  },
  current: {
    summary:
      "As they gather information about the dragon, they realize the dragon is not their immediate threat. They are about to face a group of bandits.",
  },
  sceneNumber: 5,
  totalNumOfLines: 0,
  recentHistory: [
    {
      speaker: `${role}`,
      message:
        "The bandit problem seems to be bigger than the dragon, for the moment.",
    },
    {
      speaker: `${role === "morgan" ? "jeremy" : "morgan"}`,
      message: "Well, that's unexpected.",
    },
  ],
} as GameState)}
Would have a response:[/INST]
{ "speaker": "${role}", "nextMessage": "The villagers told me that the bandits, who call themselves the 'Big Red', are a group of 20 people. They have been terrorizing the village for a while now." }</s>
[INST]
WORLD DEFINITION:
${JSON.stringify(state)}[/INST]
`;
console.log(context);
process.exit()
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
