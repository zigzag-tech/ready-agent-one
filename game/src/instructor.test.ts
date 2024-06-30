import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { Ollama } from "ollama";
import { MESSAGES } from "./server/test-prompt";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollama = new Ollama({ host: OLLAMA_HOST });
const oai = new OpenAI({
  apiKey: "ollama", // required, but unused
  baseURL: `${OLLAMA_HOST}/v1`, // updated API URL
});
// const MODEL_NAME = "llama3";
const MODEL_NAME = "gemma2";

import { z } from "zod";
import { characterOutputSchema } from "./common/characterOutputSchema";
import { extractRawContent, parseRawContentToJSON } from "./server/genPromptUtils";

const prompt = [
  {
    role: "system",
    content:
      `
You are a game script writing assistant. Based on the context provided, produce the subject\'s next action, thinking process, target, and message. 

- Ensure that the action and message are coherent and logically follow from the context.


Format of your response shoul be:
<format>
Thinking: What is the subject considering or thinking about?
Subject: Subject\'s name or identifier. Mandatory.
Action: What is the subject\'s next action? Mandatory. Use only options from the ALLOWED ACTIONS list.
Target: Who or what is the target of the action? Provide the id of the target from one of the props if applicable, otherwise null.
Message: What does the subject say or communicate next? Mandatory. Always start with an emotion emoji.
</format>
}
`,
  },
  {
    role: "user",
    content:
      `
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
    content:`
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
    content:
      `
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
    content:
      `
<response>
Subject: frodo
Thinking: Man that didn't work! This bear is distracting me from my goal.
Action: hide
Target: null
Message: 😵 Oh no, the bear didn't die! I must hide!
</response>
  `,
  },
  {
    role: "user",
    content:
      `
CONTEXT:
The story begins in a pet store called "Pet Paradise". The store is bustling with customers and pets. Morgan, a recent dog owner, is looking for tips and tricks to train her dog. She approaches Guy.

OBJECTS IN SCENE:
[
{"type":"person","name":"morgan","description":"Morgan is a recent dog owner and is looking for tips and tricks to train her dog.","position":"north"},
{"type":"person","name":"guy","description":"Guy is store clerk very clumsy and often messes things up. ","position":"north"},
{"type":"person","name":"jackie","description":"Jackie is the store manager and is looking for ways to improve the store.","position":"north"},
{"type":"object","name":"cat trees","description":"A 3-level cat tree on diplay","position":"west"},
{"type":"object","name":"dog food aisle","description":"An aisle filled with various brands of dog food","position":"east"},
{"type":"object","name":"grooming station","description":"A section for pet grooming services","position":"east"},
{"type":"object","name":"reptile terrariums","description":"Enclosures for reptiles like snakes and lizards","position":"south"},
{"type":"object","name":"pet accessories","description":"Shelves with pet collars, leashes, and clothes","position":"north_east"},
{"type":"object","name":"aquarium supplies","description":"A section with filters, decorations, and fish food","position":"east"},
{"type":"object","name":"rabbit hutches","description":"Cages and hutches for rabbits","position":"north"},
{"type":"object","name":"dog bowls","description":"A variety of dog bowls and feeders","position":"south"},

]

RECENT ACTIVITY LOG:
guy: [yawn null] What a boring day... Another day at the store.

SUBJECT NAME:
jackie

ALLOWED ACTIONS:
walk_to, look_at, examine

RESPONSE:
`,
  },
];

async function main() {
  const UserExtractSchema = z.object({
    age: z.number(),
    name: z.string(),
  });

  const client = Instructor({
    client: oai,
    mode: "JSON",
  });

  const user = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: [{ role: "user", content: "Jason is 30 years old" }],
    response_model: { schema: UserExtractSchema, name: "UserExtractSchema" },
  });

  console.log(user);
}

const textBlock = `
In our recent online meeting, participants from various backgrounds joined to discuss the upcoming tech conference. 
The names and contact details of the participants were as follows:

- Name: John Doe, Email: johndoe@email.com, Twitter: @TechGuru44
- Name: Jane Smith, Email: janesmith@email.com, Twitter: @DigitalDiva88
- Name: Alex Johnson, Email: alexj@email.com, Twitter: @CodeMaster2023

During the meeting, we agreed on several key points. The conference will be held on March 15th, 2024, at the Grand Tech Arena located at 4521 Innovation Drive. Dr. Emily Johnson, a renowned AI researcher, will be our keynote speaker. The budget for the event is set at $50,000, covering venue costs, speaker fees, and promotional activities. 

Each participant is expected to contribute an article to the conference blog by February 20th. A follow-up meeting is scheduled for January 25th at 3 PM GMT to finalize the agenda and confirm the list of speakers.
`;

async function extractData() {
  const ExtractionSchema = z.object({
    users: z
      .array(
        z.object({
          name: z.string(),
          handle: z.string(),
          twitter: z.string(),
        })
      )
      .min(3),
    location: z.string(),
    budget: z.number(),
  });

  const client = Instructor({
    client: oai,
    mode: "JSON",
  });

  const extractionStream = await client.chat.completions.create({
    messages: [{ role: "user", content: textBlock }],
    model: MODEL_NAME,
    response_model: {
      schema: ExtractionSchema,
      name: "Extraction",
    },
    max_retries: 3,
    stream: false,
  });

  // let extractedData = {};
  // process.stdout.write("Response:  ");
  // // console.log("Response:  ");
  // for await (const result of extractionStream) {
  //   extractedData = result;
  //   process.stdout.write(JSON.stringify(result));
  // }
  // // erase all of what was written
  // // Move the cursor to the beginning of the line

  // // Clear the entire line
  // process.stdout.write("\x1b[2K");

  console.log("Final extraction:", extractionStream);
}

async function characterWorkerTest() {
  console.log("start")

  const output = await ollama.chat({
    model: MODEL_NAME,
    messages: prompt as any,
    stream: false,
  });

  const rawMessage = output.message.content;
  const rawContent = extractRawContent(rawMessage);
  const json = parseRawContentToJSON(rawContent);

  console.log(json);

  // let finalOutput = {};
  // for await (const result of output) {
  //   finalOutput = result;
  //   console.log(finalOutput);
  // }

  // console.log(JSON.stringify(finalOutput, null, 2));
}

if (require.main === module) {
  // main();
  // extractData();
  characterWorkerTest();
}

