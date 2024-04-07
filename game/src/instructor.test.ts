import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { Ollama } from "ollama";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const ollama = new Ollama({ host: OLLAMA_HOST });

import { z } from "zod";
async function main() {
  const UserExtractSchema = z.object({
    age: z.number(),
    name: z.string(),
  });

  const oai = new OpenAI({
    apiKey: "ollama", // required, but unused
    baseURL: `http://${OLLAMA_HOST}/v1`, // updated API URL
  });

  const client = Instructor({
    client: oai,
    mode: "JSON",
  });

  const user = await client.chat.completions.create({
    model: "dolphin-mistral",
    messages: [{ role: "user", content: "Jason is 30 years old" }],
    response_model: { schema: UserExtractSchema, name: "UserExtractSchema" },
  });

  console.log(user);
}

if (require.main === module) {
  main();
}
