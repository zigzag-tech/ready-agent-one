import { z } from "zod";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { actionSchema, charactersEnum } from "../common/gameStateSchema";

export type Actions = z.infer<typeof actionSchema>;

export const characterInputSchema = z.object({
  from: charactersEnum,
  actions: actionSchema,
  message: z.string(),
});

export const DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy: "Jeremy has a sarcastic streak but deep down he's kind and helpful.",
  guy: "Guy is tring to acting helpful but he always messes things up.",
};

export async function genMessagePrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState,
  actions: Actions
) {
  const INST_AND_EXAMPLE_1 = `<s>[INST] You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CHARACTER DESCRIPTION, CONTEXT, CHARACTER ACTIONS to return what the character would say.
Respond with ONLY the character's speech and do NOT justify your rationale. Do not add any additional notes either.

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
    { character: "cat", actions: [{ type: "walk", destination: "emily" }] },
  ],
})}

CHARACTER ACTIONS:
${JSON.stringify({
  actions: [
    {
      type: "pet",
      target: "cat",
    },
  ],
})}

The above example would output the following response:
[/INST]
Oh hey there, kitty! What did you bring me today?
</s>`;

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
    { character: "frodo", actions: [{ type: "shoot", target: "bear" }] },
    {
      character: "bear",
      actions: [{ type: "attack", target: "frodo" }],
    },
  ],
})}

CHARACTER ACTIONS:
${JSON.stringify({
  actions: [
    {
      type: "hide",
    },
  ],
})}

The above example would output the following response:
[/INST]
Oh no, I'm in trouble! I need to hide!
</s>`;

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

CHARACTER ACTIONS:
${JSON.stringify(actions)}
[/INST]`;
  const response = await generateResponseOllama(prompt);
  return response;
}

export async function genPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const INST_AND_EXAMPLE_1 = `<s>[INST] You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CHARACTER DESCRIPTION, CONTEXT, VICINITY INFORMATION, ALLOWED ACTIONS to return an array of one or more enriched actions from the ALLOWED ACTIONS.
Use each ALLOWED ACTIONS at most once per response. Respond with ONLY the JSON and do NOT add any notes or comments.
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
    { character: "cat", actions: [{ type: "walk", destination: "emily" }] },
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
{"type": "pet", "target": "[sample_target]"}

The above example would output the following json:
[/INST]
${JSON.stringify(
  {
    actions: [
      {
        type: "pet",
        target: "cat",
      },
    ],
    reason: "Emily responds to the cat's presence with a friendly greeting.",
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
    { character: "frodo", actions: [{ type: "shoot", target: "bear" }] },
    {
      character: "bear",
      actions: [{ type: "attack", target: "frodo" }],
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
{"type": "hide"}

The above example would output the following json:
[/INST]
${JSON.stringify(
  {
    actions: [
      {
        type: "hide",
      },
    ],
    reason: "Frodo is in trouble and he expresses his fear by hiding.",
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

export function parseJSONResponse(raw: string | null) {
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
    return [] as Actions;
  }
}
