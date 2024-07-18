import { z } from "zod";

import {
  GameState,
  actionSchema,
  charactersEnum,
} from "../common/gameStateSchema";
import { Message } from "ollama";
import { characterOutputSchema } from "../common/characterOutputSchema";

export type Action = z.infer<typeof actionSchema>;

export function genPropsPrompt(newScene: string) {
  return [
    {
      role: "system",
      content: `
You are a scene writing assistant. Your job is to write the type, name, description, and position of objects mentioned in the SCENE PROVIDED.

Format of your response should be:
<response>
Position: position should be only one of "north", "west", "south", "east".
Type: type should be only one of the "person" or "object".
Name: name of the object or person.
Description: description of the object or person.
</response>
Repeat the above format for each object in the scene.
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
In a cozy room, Emily sits, a black cat curled at her feet. She tries to get the cat's attention with a toy.

RESPONSE:
`,
    },
    {
      role: "assistant",
      content: `
<response>
Position: north
Type: person
Name: emily
Description: Emily the cat lover.
</response>
<response>
Position: south
Type: object
Name: cat
Description: A black cat.
</response>
<response>
Position: south
Type: object
Name: cat toy
Description: A round toy with a bell inside.
</response>
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
In the ancient ruins, a group of 3 adventurers, Jack, Tracy, and Indiana, entered a dark chamber. They found a treasure chest and a skeleton.

RESPONSE:
`,
    },
    {
      role: "assistant",
      content: `
<response>
Position: north
Type: person
Name: jack
Description: Jack the adventurer.
</response>
<response>
Position: south
Type: person
Name: tracy
Description: Tracy the adventurer.
</response>
<response>
Position: south
Type: person
Name: indiana
Description: Indiana the adventurer.
</response>
<response>
Position: east
Type: object
Name: treasure chest
Description: A large treasure chest.
</response>
<response>
Position: east
Type: object
Name: skeleton
Description: A human skeleton.
</response>
`,
    },
    {
      role: "user",
      content: `
SCENE PROVIDED:
${newScene}

RESPONSE:
`,
    },
  ];
}

export function genActionPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const messages: Message[] = [
    {
      role: "system",
      content: `
You are a game script writing assistant. Based on the context provided, produce the subject\'s next action, thinking process, target, and message. 

- Ensure that the action and message are coherent and logically follow from the context.

Format of your response should be:
<format>
Thinking: What is the subject considering or thinking about?
Subject: Subject\'s name or identifier. Mandatory.
Action: What is the subject\'s next action? Mandatory. Use only options from the ALLOWED ACTIONS list.
Target: Who or what is the target of the action? Provide the id of the target from one of the props if applicable, otherwise null.
Message: What does the subject say or communicate next? Mandatory. Always start with an emotion emoji.
</format>
`,
    },
    {
      role: "user",
      content: `
CONTEXT:
Emily Loves cats. She is a cat lover and she is always surrounded by cats. 
Her cat is sick. 

OBJECTIVE:
Emily wants catch her cat and take it to the vet.

OBJECTS IN SCENE:
[
    {"type":"person","name":"emily","description":"Emily the cat lover.","position": "north"},
    {"type":"person","name":"cat","description":"A black cat.","position": "south"},
]

RECENT ACTIVITY LOG:
cat: [walk_to emily]
cat: [talk] Meow!

SUBJECT NAME:
Emily

ALLOWED ACTIONS:
walk_to, pet, look_at

RESPONSE:
`,
    },
    {
      role: "assistant",
      content: `
<response>
Subject: emily
Thinking: I am so worried about the cat. Must get her to the vet soon.
Action: look_at
Target: cat
Message: 😁 Hey, kitty! You want some treats?
</response>
`,
    },
    {
      role: "user",
      content: `
CONTEXT:
Frodo encounters a green bear on his way to the mountain.

OBJECTIVE:
Frodo tries to get treasure from a legendary mountain.

OBJECTS IN SCENE:
[
    {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position": "north"},
    {"type":"person","name":"bear","description":"A hungry green bear.","position": "south"},
]


RECENT ACTIVITY LOG:
frodo: [walk_to bear]
bear: [talk] Growl!
bear: [attack frodo]

SUBJECT NAME:
Frodo

ALLOWED ACTIONS:
walk_to, look_at, hide, attack

RESPONSE:
`,
    },
    {
      role: "assistant",
      content: `
<response>
Subject: frodo
Thinking: Man that didn't work! This bear is distracting me from my goal.
Action: hide
Target: null
Message: 😵 Oh no, the bear didn't die! I must hide!
</response>
`,
    },
  ];

  const newUserPrompt = `
CONTEXT:
${state.current.summary}

OBJECTS IN SCENE:
[
${state.current.props.map((prop) => JSON.stringify(prop)).join(",\n")}
]

RECENT ACTIVITY LOG:
${state.recentHistory
  .map((h) => {
    return `${h.subject}: [${h.action} ${h.target}] ${h.message || ""}`;
  })
  .join("\n")}

SUBJECT NAME:
${role}

ALLOWED ACTIONS:
walk_to, look_at, examine

RESPONSE:
`;

  messages.push({ role: "user", content: newUserPrompt });
  return messages;
}

export function extractRawContent(input: string): string {
  const startTag = "<response>";
  const endTag = "</response>";

  const startIndex = input.indexOf(startTag) + startTag.length;
  const endIndex = input.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.error(input);
    throw new Error("Invalid input format");
  }

  return input.substring(startIndex, endIndex).trim();
}

export function parseRawContentToJSON(rawContent: string): object {
  const lines = rawContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const json: { [key: string]: string } = {};

  lines.forEach((line) => {
    const [key, value] = line.split(":", 2);
    if (key && value) {
      json[key.trim().toLowerCase()] = value.trim();
    }
  });

  return json;
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
