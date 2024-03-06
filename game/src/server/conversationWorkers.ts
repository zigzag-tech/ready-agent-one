import pkg from "@livestack/core";
import ollama from "ollama";
import { z } from "zod";
const { ZZEnv, JobSpec, Workflow, conn, expose } = pkg;

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
      const response = await generateResponse(
        `You are a game player. You will receive an input prompt and you need to respond to it. Keep the response under 20 words. If you think the conversation is going nowhere, you can reply "quit" to end the conversation.
INPUT PROMPT: ${data}

ONE-LINE RESPONSE:
`
      );
      if (!response.includes("quit")) {
        output.emit(response);
      }
    }
  },
});

export const npcWorker = npcWorkerSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const data of input) {
      const response = await generateResponse(
        `You are a non-player character. You will receive an input prompt from the player and you need to respond to it. Keep the response under 20 words. Make sure to respond in a way that can keep the game going.
INPUT PROMPT: ${data}

ONE-LINE RESPONSE:
`
      );
      output.emit(response);
    }
  },
});

async function generateResponse(prompt: string) {
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
  for await (const part of response) {
    process.stdout.write(part.message.content);
    message += part.message.content;
  }

  return message;
}
