import { Message, Ollama } from "ollama";
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { z } from "zod";
import _ from "lodash";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollama = new Ollama({ host: OLLAMA_HOST });
// export const CONVO_MODEL = "command-r";
// export const CONVO_MODEL_LLAMA3 = "command-r";
export const CONVO_MODEL_LLAMA3 = "mistral:v0.3";

export async function generateResponseOllamaByMessages(messages: Message[]) {
  try {
    const response = await ollama.chat({
      options: {
        // temperature: ,
        num_predict: 3000,
      },
      // format: "json",
      stream: true,
      model: CONVO_MODEL_LLAMA3,
      messages,
    });
    let message = "";
    process.stdout.write("Response:  ");
    // console.log("Response:  ");
    for await (const part of response) {
      process.stdout.write(
        part.message.content.replace("\n", " ").replace("\r", " ")
      );
      message += part.message.content;
    }
    // erase all of what was written
    // Move the cursor to the beginning of the line
    process.stdout.write("\r");
    process.stdout.write("\r\n");
    // Clear the entire line
    process.stdout.write("\x1b[2K");
    return message;
  } catch (e) {
    console.log(e);
    // await sleep(200);
    return null;
  }
}

const oai = new OpenAI({
  apiKey: "ollama", // required, but unused
  baseURL: `${OLLAMA_HOST}/v1`, // updated API URL
});
const client = Instructor({
  client: oai,
  mode: "JSON",
});

export async function generateJSONResponseOllamaByMessages({
  messages,
  schema,
  schemaName,
}: {
  messages: any;
  schema: z.ZodObject<any>;
  schemaName: string;
}) {
  const NUM_RETRIES = 3;
  let count = 0;
  while (count < NUM_RETRIES) {
    try {
      const output = await client.chat.completions.create({
        model: CONVO_MODEL_LLAMA3,
        messages,
        response_model: {
          schema,
          name: schemaName,
        },
        stream: true,
      });
      let jsonOutput = {};
      process.stdout.write("Response:  ");
      // console.log("Response:  ");
      for await (const part of output) {
        jsonOutput = part;
        // console.log(jsonOutput);
      }
      console.log(jsonOutput);
      if (!jsonOutput) {
        throw new Error("No response from LLM");
      }
      const cleanJsonOutput = _.omit(jsonOutput, "_meta");
      schema.parse(cleanJsonOutput);
      return cleanJsonOutput;
    } catch (e) {
      console.log(e);
      // await sleep(200);
    }
    count++;
  }

  return null;

}
