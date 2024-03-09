import pkg from "@livestack/core";
import ollama from "ollama";
import Groq from "groq-sdk";
import { z } from "zod";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

const stringZ = z.string();

export const playerWorkerSpec = JobSpec.define({
  name: "PLAYER_WORKER",
  input: stringZ,
  output: stringZ,
});
export const npcWorkerSpec = JobSpec.define({
  name: "NPC_WORKER",
  input: stringZ,
  output: stringZ,
});

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  exposures: [
    expose({
      spec: playerWorkerSpec,
      input: {
        default: "player-input",
      },
      output: {
        default: "player-talk",
      },
    }),
    expose({
      spec: npcWorkerSpec,
      input: {
        default: "npc-input",
      },
      output: {
        default: "npc-talk",
      },
    }),
  ],

  connections: [
    conn({
      from: {
        spec: playerWorkerSpec,
      },
      to: {
        spec: npcWorkerSpec,
      },
    }),
    conn({
      from: {
        spec: npcWorkerSpec,
      },
      to: {
        spec: playerWorkerSpec,
      },
    }),
  ],
});

export const playerWorker = playerWorkerSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const data of input) {
      const prompt = `You are a game player. You will receive an input prompt and you need to respond to it. Keep the response under 20 words. 
      If you think the conversation is going nowhere, you can reply "quit" to end the conversation.
      INPUT PROMPT: ${data}
      
      ONE-LINE RESPONSE:
      `;
      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);
      if (!response.includes("quit")) {
        output.emit(response);
      }
    }
  },
});

export const npcWorker = npcWorkerSpec.defineWorker({
  processor: async ({ input, output, jobId }) => {
    for await (const data of input) {
      const prompt = `You are a non-player character. You will receive an input prompt from the player and you need to respond to it. 
      Keep the response under 20 words. Make sure to respond in a way that can keep the game going.
      INPUT PROMPT: ${data}
      
      ONE-LINE RESPONSE:
      `;

      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);

      await output.emit(response);
    }
  },
});

async function generateResponseOllama(prompt: string) {
  try {
    const response = await ollama.chat({
      options: {
        temperature: 0.3,
      },
      stream: true,
      model: "mistral",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    let message = "";
    process.stdout.write("Response:  ");

    for await (const part of response) {
      process.stdout.write(part.message.content);
      message += part.message.content;
    }
    process.stdout.write("\n");
    return message;
  } catch (e) {
    console.log(e);
    await sleep(1000);
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
async function generateResponseGroq(prompt: string) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "mixtral-8x7b-32768",
      // stream: true,
      temperature: 0.3,
    });
    // let message = "";
    process.stdout.write("Response:  ");

    // for await (const part of response) {
    //   message += part.choices[0].delta.content!;
    // }
    let message = response.choices[0].message.content;
    process.stdout.write(message);
    process.stdout.write("\n");
    return message;
  } catch (e) {
    console.log(e);
    await sleep(1000);
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}
