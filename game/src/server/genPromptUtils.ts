import { z } from "zod";

import {
  Criteria,
  GameState,
  actionSchema,
  charactersEnum,
} from "../common/gameStateSchema";
import { Message } from "ollama";
import { characterOutputSchema } from "../common/characterOutputSchema";

export type Action = z.infer<typeof actionSchema>;

export function genActionPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const fewShotExamples = `
=== Example 1 ===
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
<response>
Subject: emily
Thinking: I am so worried about the cat. Must get her to the vet soon.
Action: look_at
Target: cat
Message: 😁 Hey, kitty! You want some treats?
</response>

=== Example 2 ===
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
<response>
Subject: frodo
Thinking: Man that didn't work! This bear is distracting me from my goal.
Action: hide
Target: null
Message: 😵 Oh no, the bear didn't die! I must hide!
</response>
`;

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
walk_to, look_at, examine, open

RESPONSE:
`;

  const messages: Message[] = [
    {
      role: "system",
      content: `
You are a game script writing assistant. Based on the context provided, produce the subject\'s next action, thinking process, target, and message. 

- Ensure that the action and message are coherent and logically follow from the context.
- Response should be surrounded by <response></response>.
- Characters in the criterion should be from the list of characters you have been provided.

Format of your response should be:
<response>
Thinking: What is the subject considering or thinking about?
Subject: Subject\'s name or identifier. Mandatory.
Action: What is the subject\'s next action? Mandatory. Use only options from the ALLOWED ACTIONS list.
Target: Who or what is the target of the action? Provide the id of the target from one of the props if applicable, otherwise null.
Message: What does the subject say or communicate next? Mandatory. Always start with an emotion emoji.
</response>

Here are 2 examples:
${fewShotExamples}
`,
    },
    {
      role: "user",
      content: newUserPrompt,
    },
  ];
  return messages;
}

export function genActionChoicesPrompt(
  role: z.infer<typeof charactersEnum>,
  state: GameState
) {
  const fewShotExamples = `
=== Example 1 ===
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
<choice>
Label: Play Game with Cat
Subject: emily
Thinking: I need to create a distraction to gently catch her.
Action: walk_to
Target: cat
Message: 🎶 Here, kitty kitty... Let's play a little game!
</choice>
<choice>
Label: Make the Cat Relax
Subject: emily
Thinking: If I stroke her favorite spot, she might relax.
Action: pet
Target: cat
Message: 🌸 There you go, just relax... You're going to be okay.
</choice>
<choice>
Label: Feed the Cat
Subject: emily
Thinking: Maybe if I distract her with a treat, she'll stay calm.
Action: look_at
Target: cat
Message: 🍗 Look what I have for you! It's your favorite treat.
</choice>

=== Example 2 ===
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
<choice>
Label: Run Away
Subject: frodo
Thinking: I need to find a way to avoid this bear. It looks dangerous.
Action: hide
Target: bear
Message: 🤫 I must stay out of sight. Maybe it won't notice me.
</choice>
<choice>
Label: Confront the Bear
Subject: frodo
Thinking: If I don't act now, the bear might attack again.
Action: attack
Target: bear
Message: ⚔️ I'll have to defend myself! Here goes nothing!
</choice>
<choice>
Label: Distract the Bear
Subject: frodo
Thinking: Maybe I can distract it and make a run for it.
Action: look_at
Target: bear
Message: 🧀 Hey, look over here! Maybe you'd like some cheese instead?
</choice>
`;

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
walk_to, look_at, examine, open

RESPONSE:
`;

  const messages: Message[] = [
    {
      role: "system",
      content: `
You are a game script writing assistant. Based on the context provided, produce 3 sets of the subject\'s next possible action, thinking process, target, and message, as if the choices are to be made by a RPG game player.

- Ensure that the action and message are coherent and logically follow from the context.
- Ensure that the 3 choices are distinct from each other.

Format of each of your choices should be as follows:
<choice>
Label: The name of the choice to be displayed on the game UI.
Thinking: What is the subject considering or thinking about?
Subject: Subject's name or identifier. Mandatory.
Action: What is the subject\'s next action? Mandatory. Use only options from the ALLOWED ACTIONS list.
Target: Who or what is the target of the action? Provide the id of the target from one of the props if applicable, otherwise null.
Message: What does the subject say or communicate next? Mandatory. Always start with an emotion emoji.
</choice>

Here are 2 examples:
${fewShotExamples}
`,
    },
    {
      role: "user",
      content: newUserPrompt,
    },
  ];

  return messages;
}

export function extractRawActionContent(input: string): string {
  const startTag = "<response>";
  const endTag = "</response>";

  const startIndex = input.indexOf(startTag) + startTag.length;
  const endIndex = input.indexOf(endTag);

  if (startIndex === -1) {
    console.error(input);
    throw new Error("Invalid input format");
  }

  return input
    .substring(startIndex, endIndex === -1 ? undefined : endIndex)
    .trim();
}

export function extractAllTaggedContent({
  input,
  startTag,
  endTag,
}: {
  input: string;
  startTag: string;
  endTag: string;
}): string[] {
  const results: string[] = [];
  let startIndex = 0;

  while (true) {
    // Find the next startTag
    startIndex = input.indexOf(startTag, startIndex);
    if (startIndex === -1) break; // No more start tags found

    // Adjust startIndex to the actual content after the startTag
    startIndex += startTag.length;

    // Find the corresponding endTag
    const endIndex = input.indexOf(endTag, startIndex);

    // Extract content between the startTag and endTag or to the end of the string if endTag is not found
    const content = input
      .substring(startIndex, endIndex === -1 ? undefined : endIndex)
      .trim();
    results.push(content);

    // If no endTag is found, we assume the rest of the string is content and exit the loop
    if (endIndex === -1) break;

    // Move the startIndex forward to search for the next pair
    startIndex = endIndex + endTag.length;
  }

  if (results.length === 0) {
    console.error(input);
    // throw new Error(
    //   "Invalid input format: No content found between the specified tags"
    // );
  }

  return results;
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

export function parseRawCriterionContentToJSON(rawContent: string): Criteria {
  // format: (xxx|xxx|xxx|...); each token is separated by |
  // extract each token xxx and put them into an array

  const start = rawContent.indexOf("(");
  const end = rawContent.lastIndexOf(")");
  const content = rawContent.slice(start + 1, end);
  const tokens = content.split("|").map((token) => token.trim());

  const criterion = tokens[0];
  if (criterion === "is_at") {
    return {
      type: criterion as "is_at",
      character: tokens[1],
      object: tokens[2],
    };
  } else if (criterion === "performed") {
    return {
      type: criterion as "performed",
      character: tokens[1],
      action: tokens[2],
      target: tokens[3] || null,
    };
  } else {
    throw new Error("Invalid criterion format");
  }
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
