import pkg from "@livestack/core";
import ollama from "ollama";
import Groq from "groq-sdk";
import { z } from "zod";
import { summaryPlusHistorySchema } from "../common/summaryPlusHistorySchema";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

const stringZ = z.string();

export const playerWorkerSpec = JobSpec.define({
  name: "PLAYER_WORKER",
  input: summaryPlusHistorySchema,
  output: stringZ,
});
export const npcWorkerSpec = JobSpec.define({
  name: "NPC_WORKER",
  input: summaryPlusHistorySchema,
  output: stringZ,
});

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: {
    npc: stringZ,
    player: stringZ,
  },
  output: summaryPlusHistorySchema,
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
        spec: summarySpec,
        input: "player",
      },
    }),
    conn({
      from: {
        spec: npcWorkerSpec,
      },
      to: {
        spec: summarySpec,
        input: "npc",
      },
    }),
    conn({
      from: {
        spec: summarySpec,
      },
      to: {
        spec: playerWorkerSpec,
      },
    }),
    conn({
      from: {
        spec: summarySpec,
      },
      to: {
        spec: npcWorkerSpec,
      },
    }),
  ],
});

export const playerWorker = playerWorkerSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const { summary, recentHistory } of input) {
      // if the last message was from the player, then the player should not respond
      if (recentHistory[recentHistory.length - 1].startsWith("Human Player")) {
        continue;
      }

      const prompt = `You are a game player. You will receive a conversation history and you need to respond to it. Keep the response under 20 words. 
      If you think the conversation is going nowhere, you can reply "quit" to end the conversation. 
      Avoid repeating what was already said in the conversation. Add something new to the conversation for your response.
      SUMMARY OF PAST CONVERSATION: 
      ${summary}
      RECENT CONVERSATION HISTORY:
      ${recentHistory.join("\n")}
      
      HUMAN PLAYER:`;
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
    for await (const { summary, recentHistory } of input) {
      // if the last message was from the player, then the player should not respond
      if (recentHistory[recentHistory.length - 1].startsWith("NPC")) {
        continue;
      }

      const prompt = `You are a non-player character. You will receive a conversaiton history from the player and you need to respond to it. 
      Keep the response under 20 words. Make sure to respond in a way that can keep the game going.
      Avoid repeating what was already said in the conversation. Add something new to the conversation for your response.
      SUMMARY OF PAST CONVERSATION: 
      ${summary}
      RECENT CONVERSATION HISTORY:
      ${recentHistory.join("\n")}
      
      NPC:`;

      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);
      await output.emit(response);
    }
  },
});

export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    const recentHistory: string[] = [];
    let summaryOfAllThePast = "";

    while (true) {
      const { type, value } = await Promise.race([
        input("npc")
          .nextValue()
          .then((r) => ({
            type: "NPC" as const,
            value: r,
          })),
        input("player")
          .nextValue()
          .then((r) => ({
            type: "Human Player" as const,
            value: r,
          })),
      ]);

      if (!value) {
        console.log("No value");
        break;
      }

      recentHistory.push(`${type}: ${value}`);
      // keep accululating the history until it reaches 10
      // then take the oldest 5 and fold it into the summary

      if (recentHistory.length > 10) {
        const oldest = recentHistory.splice(0, 5);
        const prompt = `Summarize the previous summary and the recent conversation history into a single summary.
SUMMARY OF PAST CONVERSATION:
${summaryOfAllThePast}
RECENT CONVERSATION HISTORY:
${oldest.join("\n")}

NEW SUMMARY:
        `;
        summaryOfAllThePast = await generateResponseOllama(prompt);
      }

      await output.emit({
        summary: summaryOfAllThePast,
        recentHistory: recentHistory,
      });
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
