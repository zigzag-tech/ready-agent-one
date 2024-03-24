import { actionSchema, charactersEnum } from "../common/gameStateSchema";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";

type Actions = z.infer<typeof actionSchema>;
export const characterSpec = JobSpec.define({
  name: "CHARACTER_WORKER",
  input: { default: turnAndStateSchema, "user-input": z.string().nullable() },
  output: {
    default: z.object({
      // line: z.string(),
      from: charactersEnum,
      actions: actionSchema,
    }),
    "user-signal": z.enum(["ENABLE", "DISABLE"]),
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
        const response = await genPrompt(whoseTurn, state);
        actions = parseJSONResponse(response) || "...";
      }

      await output("default").emit({
        from: whoseTurn,
        actions,
      });
    }
  },
});

const DIRECTIVE_BY_ROLE = {
  morgan:
    "Your job is play the role of our main character, Morgan. Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy:
    "Your job is play the role of a supporting character Jeremy. Jeremy has a sarcastic streak but deep down he's kind and helpful.",
  guy: "Your job is play the role of a supporting character Guy. Guy is tring to acting helpful but he always messes things up.",
};

const vicinity = [
  {
    type: "object",
    name: "mysterious artifact",
    description: "A glowing, ancient-looking artifact rests on a pedestal.",
    position: "5 meters ahead",
  },
  {
    type: "person",
    name: "wise old man",
    description:
      "An elderly man with a long, white beard stands near the artifact.",
    position: "6 meters ahead",
  },
];

const actionsAllowed = [
  {
    name: "walk",
    description: "This action will change the character's current position.",
    parameters: [
      {
        name: "destination",
        description: "The target location to move to.",
        type: "string",
      },
    ],
  },
  {
    name: "talk",
    description:
      "The character can engage in conversation with a nearby person.",
    parameters: [
      {
        name: "message",
        description: "The message to convey in the conversation.",
        type: "string",
      },
    ],
  },
  {
    name: "jump",
    description: "The character can jump up in place.",
  },
];

async function genPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const context = `<s> [INST] You are a character writer for a game. Your task is to write the actions and dialogue for the character named ${role}. Use the provided context, vicinity information, allowed actions, and rules to guide ${role}'s behavior and interactions within the game world.
Context:
${DIRECTIVE_BY_ROLE[role]}

What's in the vicinity:
${JSON.stringify(vicinity)}

Actions allowed:
${JSON.stringify(actionsAllowed)}

Rules:
The character needs to be close to a person in order to talk to them.
The character needs to be close to an object in order to inspect or perform actions on it.
You can perform only one action at a time.
Output your response in JSON format, adhering to the format defined in Actions allowed.
[/INST]
EXAMPLE
{
  "type": "walk",
  "destination": "mysterious artifact",
}
[INST] Your json response: [/INST]
</s>
`;
  // backup
  // const context = `<s>[INST]${DIRECTIVE_BY_ROLE[role]}

  // ### INSTRUCTIONS
  // - Keep the response in line with the PLOT SUMMARY provided and the CONVERSATION HISTORY.
  // - DO NOT repeat what's already said in the CONVERSATION HISTORY.
  // - This is real life conversation, so be colloquial and natural.
  // - Write only the JSON and nothing else.
  // - Avoid being too agreeable, predictable and repetitive. Insert drama, personality and conflict when appropriate.
  // - Keep the response short, under 20 words.
  // - Response with JSON { "speaker": "${role}", "nextMessage": "[character message]" }, replace [character message] with what the player should say next.

  // For instance, the following:
  // WORLD DEFINITION:
  // ${JSON.stringify({
  //   previous: {
  //     summary:
  //       "In a fantasy world, three warriors are about to face a dragon. They went out to find the dragon to save their village.",
  //   },
  //   current: {
  //     summary:
  //       "As they gather information about the dragon, they realize the dragon is not their immediate threat. They are about to face a group of bandits.",
  //   },
  //   sceneNumber: 5,
  //   totalNumOfLines: 0,
  //   recentHistory: [
  //     {
  //       speaker: `${role}`,
  //       message:
  //         "The bandit problem seems to be bigger than the dragon, for the moment.",
  //     },
  //     {
  //       speaker: `${role === "morgan" ? "jeremy" : "morgan"}`,
  //       message: "Well, that's unexpected.",
  //     },
  //   ],
  // } as GameState)}
  // Would have a response:[/INST]
  // { "speaker": "${role}", "nextMessage": "The villagers told me that the bandits, who call themselves the 'Big Red', are a group of 20 people. They have been terrorizing the village for a while now." }</s>
  // [INST]
  // WORLD DEFINITION:
  // ${JSON.stringify(state)}[/INST]
  // `;
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
  if (!raw) return [] as Actions;
  try {
    // heuristic to find the [] enclosure substring
    // note: 03-23 we tried to allow for multiple actions in json response
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const responseJsonString = raw.slice(start, end);
    const responseJson = [JSON.parse(responseJsonString)] as Actions;
    return responseJson;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return [
      { type: "talk", message: "I'm sorry, I don't understand." },
    ] as Actions;
  }
}
