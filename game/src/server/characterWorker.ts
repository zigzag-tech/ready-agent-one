import { green } from "ansis";
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

// const DIRECTIVE_BY_ROLE = {
//   morgan:
//     "Your job is play the role of our main character, Morgan. Morgan is prudent, courageous but could slip into self doubt from time to time. ",
//   jeremy:
//     "Your job is play the role of a supporting character Jeremy. Jeremy has a sarcastic streak but deep down he's kind and helpful.",
//   guy: "Your job is play the role of a supporting character Guy. Guy is tring to acting helpful but he always messes things up.",
// };
const DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy: "Jeremy has a sarcastic streak but deep down he's kind and helpful.",
  guy: "Guy is tring to acting helpful but he always messes things up.",
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
  const context = `<s>[INST] You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CONTEXT, VICINITY INFORMATION, ALLOWED ACTIONS to return an enriched action using one of the ALLOWED ACTIONS.
CHARACTER NAME:
Emily

CONTEXT:
Emily Loves cats. She is a cat lover and she is always surrounded by cats.

VICINITY INFORMATION:
${JSON.stringify([
  {
    type: "object",
    name: "mysterious litter box",
    description:
      "A litter box that seems to be glowing with a mysterious light.",
    position: "5 meters ahead",
  },
])}

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "talk", "message": "[sample_message]"}

The above example would output the following json:
[/INST]
{
  "type": "walk",
  "destination": "mysterious litter box"
}
</s>
[INST]
CHARACTER NAME:
${role}

CONTEXT:
${DIRECTIVE_BY_ROLE[role]}

VICINITY INFORMATION:
${JSON.stringify(vicinity)}

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "talk", "message": "[sample_message]"}
{"type": "jump"}
[/INST]
`;
  // console.log("context", green`${context}`);
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
