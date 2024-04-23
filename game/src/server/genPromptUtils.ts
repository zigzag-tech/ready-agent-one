import { z } from "zod";
import { generateResponseOllama } from "./generateResponseOllama";
import { GameState } from "./summarySpec";
import { actionSchema, charactersEnum } from "../common/gameStateSchema";

export type Action = z.infer<typeof actionSchema>;

export const characterOutputSchema = z.object({
  subject: charactersEnum,
  reflection: z.string(),
  intent: z.string(),
  actions: z.array(actionSchema),
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
  actions: Action[]
) {
  const INST_AND_EXAMPLE_1 = `<s>[INST] You are a helpful assistant. Your job is to use the provided CHARACTER NAME, CHARACTER DESCRIPTION, CONTEXT, CHARACTER ACTIONS to return what the character would say.
INSTRUCTIONS

- Respond with ONLY the character's speech and do NOT justify your rationale. 
- Do not add any additional notes either.
- Respond with only the JSON and do NOT explain.

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
${JSON.stringify(
  {
    message: "Oh hey there, kitty! What did you bring me today?",
  },
  null,
  2
)}
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
${JSON.stringify(
  {
    message: "Oh no, I'm in trouble! I need to hide!",
  },
  null,
  2
)}
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
  const responseRaw = await generateResponseOllama(prompt);
  let response = "Sorry I don't know what to do.";
  try {
    const response = JSON.parse(responseRaw || "") as { message: string };
    return response.message;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", responseRaw);
  }
  return response;
}

export function genActionPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const INST_AND_EXAMPLE_1 = `<s>[INST]
You are a helpful assistant. Your job is to determine the next actions of the subject based on the context provided.

INSTRUCTIONS:
- Use each SUBJECT ALLOWED ACTIONS at most once per response. 
- Always include a "talk" action with a message in the response.
- Respond with ONLY the JSON and do NOT add any notes or comments.
- Think step by step and provide the most logical action for the subject.

CONTEXT:
Emily Loves cats. She is a cat lover and she is always surrounded by cats. 
Her cat is sick. 

OBJECTIVE:
Emily wants catch her cat and take it to the vet.

OBJECTS IN SCENE:
[
  {"type":"person","name":"emily","description":"Emily the cat lover.","position":"5 meters ahead"},
  {"type":"person","name":"cat","description":"A black cat.","position":"2 meters ahead"}
]

RECENT ACTIVITY LOG:
[
  {"subject: "cat", "action_type":"walk", "target":"emily"},
  {"subject: "cat", "action_type":"talk", "message":"Meow."}
]

SUBJECT NAME:
Emily

SUBJECT ALLOWED ACTIONS:
[
  {"action_type": "walk_to", "target": "[sample_destination]"},
  {"action_type": "look_at", "target": "[sample_target]"},
  {"action_type": "feed", "target": "[sample_target]"},
  {"action_type": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTION(S):
[/INST]
{
  "subject": "emily",
  "reflection": "I am so worried about the cat. Must get her to the vet soon.",
  "intent": "I must catch the cat and take her to the vet.",
  "actions": [
    {
      "action_type": "look_at",
      "target": "cat"
    },
    {
      "action_type": "talk",
      "message": "Hey, kitty! You want some treats?"
    }
  ],
  "reason": "Emily wants to lure the cat with treats."
}</s>`;

  const EXAMPLE_2 = `<s>
[INST]
CONTEXT:
Frodo encounters a green bear on his way to the mountain.

OBJECTIVE:
Frodo tries to get treasure from a legendary mountain.

OBJECTS IN SCENE:
[
  {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position":"33 meters ahead"},
  {"type":"person","name":"bear","description":"A hungry green bear.","position":"2 meters behind"},
]


RECENT ACTIVITY LOG:
[
  {"subject":"frodo", "action_type":"shoot", "target":"bear"},
  {"subject":"bear", "action_type":"talk", "message":"Growl!"},
  {"subject":"bear", "action_type":"attack","target":"frodo"},
]

SUBJECT NAME:
Frodo

SUBJECT ALLOWED ACTIONS:
[
  {"action_type": "shoot", "target": "[some_target]"},
  {"action_type": "attack", "target": "[some_target]"},
  {"action_type": "hide", "target": null },
  {"action_type": "talk", "message": "[sample_message]"}
]

SUBJECT NEXT ACTION(S):
[/INST]
{
"subject": "frodo",
  "reflection": "Man that didn't work! This bear is distracting me from my goal.",
    "intent": "I must hide from the bear.",
  "actions": [
    {
      "action_type": "talk",
      "message": "Oh no, the bear didn't die! I must hide!"
    },
    {
      "action_type": "hide",
      "target": null
    }
  ],
  "reason": "Frodo doesn't want to get hurt so that he can continue on with his adventure."
}</s>`;

  const prompt = `${INST_AND_EXAMPLE_1}

${EXAMPLE_2}
<s>
[INST]
CONTEXT:
${state.current.summary}

OBJECTIVE:

OBJECTS IN SCENE:
[
${state.current.props.map((prop) => JSON.stringify(prop)).join(",\n")}
]

RECENT ACTIVITY LOG:
[
${state.recentHistory
  .flatMap((history) =>
    history.actions.map((action) => {
      const baseObj = {
        subject: history.subject,
        action_type: action.action_type,
      };
      if (action.target) baseObj["target"] = action.target;
      if (action.message) baseObj["message"] = action.message;
      return baseObj;
    })
  )
  .join(",\n")}
]

SUBJECT NAME:
${role}

SUBJECT ALLOWED ACTIONS:
[
  {"action_type": "talk", "message": "[sample_message]"},
  {"action_type": "walk_to", "target": "[sample_destination]"},
  {"action_type": "jump", "target": null },
  {"action_type": "examine", "target": "[sample_target]" },
  {"action_type": "operate", "target": "[sample_target]" },
  {"action_type": "punch", "target": "[sample_target]" },
  {"action_type": "kick", "target": "[sample_target]" },
  {"action_type": "run_to", "target": "[sample_destination]" }
]

SUBJECT NEXT ACTION(S):
[/INST]
`;
  return prompt;
}

export function parseJSONResponse(raw: string) {
  try {
    // heuristic to find the [] enclosure substring
    // note: 03-23 we tried to allow for multiple actions in json response
    // const start = raw.indexOf("{");
    // const end = raw.lastIndexOf("}") + 1;
    // const responseJsonString = raw.slice(start, end);
    const responseJson = JSON.parse(raw.trim()) as z.infer<
      typeof characterOutputSchema
    >;
    return responseJson;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    throw e;
  }
}
