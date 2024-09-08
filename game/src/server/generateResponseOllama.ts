import { format } from "winston";
import { Message, Ollama } from "ollama";
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { z } from "zod";
import _ from "lodash";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollama = new Ollama({ host: OLLAMA_HOST });
// export const CONVO_MODEL = "command-r";
// export const CONVO_MODEL_LLAMA3 = "command-r";
const CONVO_MODEL = "llama3.1";
// const CONVO_MODEL = "gemma2";

export async function generateResponseOllamaByMessages(messages: Message[]) {
  try {
    const response = await ollama.chat({
      options: {
        // temperature: ,
        num_predict: 3000,
      },
      // format: "json",
      stream: true,
      model: CONVO_MODEL,
      messages,
    });
    let message = "";
    // process.stdout.write("Response:  ");
    // console.log("Response:  ");
    for await (const part of response) {
      // process.stdout.write(
      //   part.message.content.replace("\n", " ").replace("\r", " ")
      // );
      message += part.message.content;
    }
    // erase all of what was written
    // Move the cursor to the beginning of the line
    // process.stdout.write("\r");
    // process.stdout.write("\r\n");
    // // Clear the entire line
    // process.stdout.write("\x1b[2K");
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
  const NUM_RETRIES = 10;
  let count = 0;
  while (count < NUM_RETRIES) {
    let jsonOutput: any = {};
    let cleanJsonOutput: any = {};

    try {
      const output = await client.chat.completions.create({
        model: CONVO_MODEL,
        messages,
        temperature: 1.2,
        response_model: {
          schema,
          name: schemaName,
        },
        stream: true,
        // response_format:{
        //   type:"json_object"
        // }
      });

      // process.stdout.write("Response:  ");
      // console.log("Response:  ");
      for await (const part of output) {
        jsonOutput = part;
        // console.log(jsonOutput);
      }
      // console.log(jsonOutput);
      if (!jsonOutput) {
        throw new Error("No response from LLM");
      }
      cleanJsonOutput = _.omit(jsonOutput, "_meta");
      console.log(cleanJsonOutput);
      schema.parse(cleanJsonOutput);
      return cleanJsonOutput;
    } catch (e) {
      console.log(JSON.stringify(cleanJsonOutput, null, 2));
      console.log(JSON.stringify(e, null, 2));
      // await sleep(200);
    }
    count++;
  }

  return null;
}
