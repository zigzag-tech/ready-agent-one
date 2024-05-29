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
    stream: true,
  });

  let extractedData = {};
  process.stdout.write("Response:  ");
  // console.log("Response:  ");
  for await (const result of extractionStream) {
    extractedData = result;
    process.stdout.write(JSON.stringify(result));
  }
  // erase all of what was written
  // Move the cursor to the beginning of the line
  process.stdout.write("\r");
  process.stdout.write("\r\n");
  // Clear the entire line
  process.stdout.write("\x1b[2K");

  console.log("Final extraction:", extractedData);
}

async function characterWorkerTest() {
  const client = Instructor({
    client: oai,
    mode: "JSON",
  });

  const output = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: MESSAGES as any,
    response_model: {
      schema: characterOutputSchema,
      name: "characterOutputSchema",
    },
    stream: true,
  });

  let finalOutput = {};
  for await (const result of output) {
    finalOutput = result;
    console.log(finalOutput);
  }

  console.log(finalOutput);
}

if (require.main === module) {
  // main();
  characterWorkerTest();
}
