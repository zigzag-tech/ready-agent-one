import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { Ollama } from "ollama";
// const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
// const ollama = new Ollama({ host: OLLAMA_HOST });

import {
  generateObject,
  jsonObjectPrompt,
  ollama,
  zodSchema,
} from "modelfusion";
import { z } from "zod";

const listCityDestinations = (country: string) =>
  generateObject({
    model: ollama
      .ChatTextGenerator({
        model: "mistral",
        temperature: 0,
      })
      .asObjectGenerationModel(jsonObjectPrompt.text()),

    schema: zodSchema(
      z.object({
        destinations: z.array(
          z.object({
            city: z.string(),
            region: z.string(),
            description: z.string(),
          })
        ),
      })
    ),

    prompt:
      `List 5 city destinations in ${country} for weekend trips. ` +
      `Describe in 1 sentence what is unique and interesting about each destination.`,
  });

async function main() {
  const r = await listCityDestinations("France");
  console.log(r);
}

main().catch(console.error);
