import { green } from "ansis";
import { actionSchema, charactersEnum } from "../common/gameStateSchema";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { turnAndStateSchema } from "./turnSpecAndWorker";
import { JobSpec } from "@livestack/core";
import { z } from "zod";

// TODO:
// 1. let LLM generate actions (maybe from a set of basic actions)
// 2. Try an entirely different scenario

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

export const DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy: "Jeremy has a sarcastic streak but deep down he's kind and helpful.",
  guy: "Guy is tring to acting helpful but he always messes things up.",
};

async function genPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const INST_AND_EXAMPLE_1 = `<s>[INST] You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CHARACTER DESCRIPTION, CONTEXT, VICINITY INFORMATION, ALLOWED ACTIONS to return an array of one or more enriched actions from the ALLOWED ACTIONS. Use each ALLOWED ACTIONS at most once per response. Respond with only the JSON and do NOT justify your rationale.
CHARACTER NAME:
Emily
  
CHARACTER DESCRIPTION:
Emily is a cat lover.

CONTEXT:
${JSON.stringify({
  current: {
    summary:
      "Emily Loves cats. She is a cat lover and she is always surrounded by cats.",
  },
  recentHistory: [
    { speaker: "cat", actions: [{ type: "walk", destination: "emily" }] },
  ],
})}

VICINITY INFORMATION:
${JSON.stringify([
  {
    type: "person",
    name: "emily",
    description: "Emily the cat lover.",
    position: "5 meters ahead",
  },
  {
    type: "person",
    name: "cat",
    description: "A black cat.",
    position: "2 meters ahead",
  },
])}

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "talk", "message": "[sample_message]"}
{"type": "pet", "target": "[sample_target]"}

The above example would output the following json:
[/INST]
${JSON.stringify(
  {
    actions: [
      {
        type: "talk",
        message: "oh hey there! What did you bring me today?",
      },
      {
        type: "pet",
        target: "cat",
      },
    ],
    // reason: "Emily responds to the cat's presence with a friendly greeting.",
  },
  null,
  2
)}</s>`;

  const EXAMPLE_2 = `<s>[INST]CHARACTER NAME:
Frodo

CHARACTER DESCRIPTION:
Frodo is a hobbit that loves adventures.

CONTEXT:
${JSON.stringify({
  current: {
    summary: "Frodo encounters a green bear on his way to the mountain.",
  },
  recentHistory: [
    { speaker: "frodo", actions: [{ type: "shoot", target: "bear" }] },
    {
      speaker: "bear",
      actions: [
        { type: "talk", message: "yummy human!" },
        { type: "attack", target: "frodo" },
      ],
    },
  ],
})}

VICINITY INFORMATION:
${JSON.stringify([
  {
    type: "person",
    name: "frodo",
    description: "Frodo the hobbit.",
    position: "33 meters ahead",
  },
  {
    type: "person",
    name: "bear",
    description: "A hungry green bear.",
    position: "2 meters behind",
  },
])}
  
ALLOWED ACTIONS:
{"type": "shoot", "target": "[sample_target]"}
{"type": "attack", "target": "[sample_target]"}
{"type": "talk", "message": "[sample_message]"}

The above example would output the following json:
[/INST]
${JSON.stringify(
  {
    actions: [
      {
        type: "talk",
        message: "oh no! I'm in trouble!",
      },
    ],
    // reason: "Frodo is in trouble and he expresses his fear.",
  },
  null,
  2
)}</s>`;

  const prompt = `
${INST_AND_EXAMPLE_1}

${EXAMPLE_2}
[INST]
CHARACTER NAME:
${role}

CHARACTER DESCRIPTION:
${DIRECTIVE_BY_ROLE[role]}

CONTEXT:
${JSON.stringify({ ...state, current: { summary: state.current.summary } })}

VICINITY INFORMATION:
${JSON.stringify(state.current.props)}

ALLOWED ACTIONS:
{"type": "walk", "destination": "[sample_destination]"}
{"type": "talk", "message": "[sample_message]"}
{"type": "jump" }
{"type": "examine", "target": "[sample_target]" }
{"type": "operate", "target": "[sample_target]" }
{"type": "punch", "target": "[sample_target]" }
{"type": "kick", "target": "[sample_target]" }
{"type": "run", "destination": "[sample_destination]" }

[/INST]
`;
  // console.log("prompt: ", green`${prompt}`);
  const response = await generateResponseOllama(prompt);
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
    // const start = raw.indexOf("{");
    // const end = raw.lastIndexOf("}") + 1;
    // const responseJsonString = raw.slice(start, end);
    const responseJson = JSON.parse(raw.trim()) as { actions: Actions };
    return responseJson.actions;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return [
      { type: "talk", message: "I'm sorry, I don't understand." },
    ] as Actions;
  }
}
