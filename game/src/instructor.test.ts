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
const MODEL_NAME = "llama3";

import { z } from "zod";
import { characterOutputSchema } from "./common/characterOutputSchema";

const prompt = [
  {
    role: "system",
    content:
      '\nBased on the context provided, produce a JSON with the subject\'s next action, thinking process, target, and message. Ensure that the action and message are coherent and logically follow from the context.\n\n Shape of the JSON:\n{\n  "subject": "Subject\'s name or identifier. Mandatory.",\n  "thinking": "What is the subject considering or thinking about?",\n  "action": "What is the subject\'s next action? Use one verb. Mandatory.",\n  "target": "Who or what is the target of the action? Provide coordinates in the format of "[x,y]" if applicable, otherwise null.",\n  "message": "What does the subject say or communicate next? Mandatory."\n}\n',
  },
  {
    role: "user",
    content:
      '\nCONTEXT:\nEmily Loves cats. She is a cat lover and she is always surrounded by cats. \nHer cat is sick. \n\nOBJECTIVE:\nEmily wants catch her cat and take it to the vet.\n\nOBJECTS IN SCENE:\n[\n    {"type":"person","name":"emily","description":"Emily the cat lover.","position": "[0,0]"},\n    {"type":"person","name":"cat","description":"A black cat.","position": "[0,5]"},\n]\n\nRECENT ACTIVITY LOG:\ncat: [walk_to [0,0]]\ncat: [talk] Meow!\n\nSUBJECT NAME:\nEmily\n\nRESPONSE:\n',
  },
  {
    role: "assistant",
    content:
      '\n{\n  "subject": "emily",\n  "thinking": "I am so worried about the cat. Must get her to the vet soon.",\n  "action": "look_at",\n  "target": "cat",\n  "message": "Hey, kitty! You want some treats?"\n}\n',
  },
  {
    role: "user",
    content:
      '\nCONTEXT:\nFrodo encounters a green bear on his way to the mountain.\n\nOBJECTIVE:\nFrodo tries to get treasure from a legendary mountain.\n\nOBJECTS IN SCENE:\n[\n    {"type":"person","name":"frodo","description":"Frodo the hobbit. Frodo loves adventures.","position": "[3,2]"},\n    {"type":"person","name":"bear","description":"A hungry green bear.","position": "[1,5]"},\n]\n\n\nRECENT ACTIVITY LOG:\nfrodo: [walk_to [1,5]]\nbear: [talk] Growl!\nbear: [attack frodo]\n\nSUBJECT NAME:\nFrodo\n\nRESPONSE:\n',
  },
  {
    role: "assistant",
    content:
      '\n{\n  "subject": "frodo",\n  "thinking": "Man that didn\'t work! This bear is distracting me from my goal.",\n  "action": "hide",\n  "target": null,\n  "message": "Oh no, the bear didn\'t die! I must hide!"\n}\n  ',
  },
  {
    role: "user",
    content:
      `\nCONTEXT:\nThe story begins in a pet store called \'Pet Paradise\'. The store is bustling with customers and pets. Morgan, a recent dog owner, is looking for tips and tricks to train her dog. She approaches Guy.\n\nOBJECTS IN SCENE:\n[\n{"type":"person","name":"morgan","description":"Morgan is a recent dog owner and is looking for tips and tricks to train her dog.","position":"[-1,-1]"},\n{"type":"person","name":"guy","description":"Guy is store clerk very clumsy and often messes things up. ","position":"[2,2]"},\n{"type":"person","name":"jackie","description":"Jackie is the store manager and is looking for ways to improve the store.","position":"[5,5]"},\n{"type":"object","name":"cat trees","description":"A 3-level cat tree on diplay","position":"[0,10]"},\n{"type":"object","name":"dog food aisle","description":"An aisle filled with various brands of dog food","position":"[5,3]"},\n{"type":"object","name":"fish tanks","description":"A row of aquariums with different kinds of fish","position":"[-2,5]"},\n{"type":"object","name":"bird cages","description":"Cages with various colorful birds inside","position":"[3,-1]"},\n{"type":"object","name":"cash register","description":"The checkout counter with a cash register","position":"[-1, -5]"},\n{"type":"object","name":"pet toys","description":"A display of assorted pet toys","position":"[2,2]"},\n{"type":"object","name":"grooming station","description":"A section for pet grooming services","position":"[6,-3]"},\n{"type":"object","name":"reptile terrariums","description":"Enclosures for reptiles like snakes and lizards","position":"[-4,4]"},\n{"type":"object","name":"pet accessories","description":"Shelves with pet collars, leashes, and clothes","position":"[-3,3]"},\n{"type":"object","name":"aquarium supplies","description":"A section with filters, decorations, and fish food","position":"[4,4]"},\n{"type":"object","name":"rabbit hutches","description":"Cages and hutches for rabbits","position":"[1,6]"},\n{"type":"object","name":"dog bowls","description":"A variety of dog bowls and feeders","position":"[6,1]"},\n{"type":"object","name":"dog training books","description":"A shelf filled with books and manuals on dog training","position":"[-1,4]"},\n{"type":"object","name":"dog vitamins and supplements","description":"A section with vitamins and supplements for dogs","position":"[2,-2]"},\n{"type":"object","name":"dog beds","description":"A variety of comfortable dog beds","position":"[3,7]"},\n{"type":"object","name":"dog bathing station","description":"A station equipped for bathing dogs","position":"[4,-3]"},\n{"type":"object","name":"dog food samples","description":"A table with free samples of various dog foods","position":"[3,-5]"},\n{"type":"object","name":"puppy playpen","description":"An area for puppies to play and socialize","position":"[0,3]"},\n{"type":"object","name":"dog adoption posters","description":"Posters and flyers about dogs available for adoption","position":"[1,-4]"},\n{"type":"object","name":"dog training clickers","description":"A rack with various dog training clickers","position":"[-5,5]"},\n{"type":"object","name":"dog beds","description":"A variety of comfortable dog beds","position":"[3,7]"},\n{"type":"object","name":"dog grooming supplies","description":"Shampoos, brushes, and other grooming items for dogs","position":"[7,2]"},\n{"type":"object","name":"dog training area","description":"An area with agility equipment for dog training","position":"[8,-2]"},\n{"type":"object","name":"dog crates","description":"Different sizes of dog crates and kennels","position":"[-2,-1]"},\n{"type":"object","name":"dog treats","description":"Shelves stocked with a variety of dog treats","position":"[4,-3]"},\n{"type":"object","name":"dog leashes and collars","description":"A display with different styles of leashes and collars","position":"[-5,2]"},\n{"type":"object","name":"dog clothing","description":"A section with clothes and costumes for dogs","position":"[5,-4]",\n{"type":"object","name":"dog carriers","description":"Portable dog carriers for travel","position":"[-3,1]"}\n]\n\nRECENT ACTIVITY LOG:\nguy: [yawn null] What a boring day... Another day at the store.\n\nSUBJECT NAME:\njackie\n\nRESPONSE:\n`,
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
  // process.stdout.write("\r");
  // process.stdout.write("\r\n");
  // // Clear the entire line
  // process.stdout.write("\x1b[2K");

  console.log("Final extraction:", extractionStream);
}

async function characterWorkerTest() {
  const client = Instructor({
    client: oai,
    mode: "JSON",
  });

  const output = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: prompt as any,
    response_model: {
      schema: characterOutputSchema,
      name: "characterOutputSchema",
    },
    stream: true,
  });

  let finalOutput = {};
  for await (const result of output) {
    finalOutput = result;
    // console.log(finalOutput);
  }

  console.log(JSON.stringify(finalOutput, null, 2));
}

if (require.main === module) {
  // main();
  // extractData();
  characterWorkerTest();
}
