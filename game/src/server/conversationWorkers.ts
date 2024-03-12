import pkg from "@livestack/core";
import ollama from "ollama";
import Groq from "groq-sdk";
import { z } from "zod";
import { summaryPlusHistorySchema } from "../common/summaryPlusHistorySchema";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

const CONVO_MODEL = "gemma";

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
  output: {
    "for-npc": summaryPlusHistorySchema,
    "for-player": summaryPlusHistorySchema,
  },
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
        output: "for-player",
      },
      to: {
        spec: playerWorkerSpec,
      },
    }),
    conn({
      from: {
        spec: summarySpec,
        output: "for-npc",
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
      // console.log("PLAYER WORKER INPUT", summary, recentHistory);
      // if the last message was from the player, then the player should not respond
      if (recentHistory[recentHistory.length - 1].startsWith("Human Player")) {
        continue;
      }

      const context = `You are a lone human player in a open-world game. You always travel by yourself and are curious about the world and want to explore it.
      Your job is to respond to a conversation, with questions or comments, so that you can get more information and the game story plot keeps evolving. A conversation history is provided to you below. 
      If the conversation looks like it's stalled or you think it's time to end it, say parting words.
      Avoid asking about the same question over and over. If the conversation history becomes repetitive, change topic or say parting words.
      If the conversation history looks like it's concluded, the human's response should be { "quit": true }.
      Keep the response under 20 words. 

      SUMMARY OF THE PAST: 
      ${summary}
      RECENT CONVERSATION HISTORY:
      ${recentHistory.join("\n")}
      `;
      const question = `What's the human player's response?`;
      const prompt = coercedJSONPrompt({ context, question });
      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);
      await output.emit(parseJSONResponse(response));
    }
  },
});

function parseJSONResponse(raw: string) {
  try {
    // heuristic to find the {} enclosure substring
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const responseJsonString = raw.slice(start, end);
    const responseJson = JSON.parse(responseJsonString) as {
      nextResponse: string;
      quit: boolean;
    };
    if (!responseJson.quit) {
      // console.log("PLAYER WORKER RESPONSE", response);
      return responseJson.nextResponse;
    } else {
      return "[The human player has decided to quit the conversation.]";
    }
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}

export const npcWorker = npcWorkerSpec.defineWorker({
  processor: async ({ input, output, jobId }) => {
    for await (const { summary, recentHistory } of input) {
      // console.log("NPC WORKER INPUT", summary, recentHistory);
      // if the last message was from the player, then the player should not respond
      if (recentHistory[recentHistory.length - 1].startsWith("NPC")) {
        continue;
      }

      const context = `You are NPC A, a non-player character (NPC) in an open world game. Your job is to respond to a conversation with a human player to provide useful information to him. You should add to the conversation in the way to develop the game plot. A conversation history is provided to you below. 
      Avoid repeating topics that are already covererd in the conversation. If the conversation history becomes repetitive, suggest a new topic or direction for the conversation.
      If the human player souhnds like they are ending the conversation, end it by saying parting words. 
      Keep the response under 20 words. 

      SUMMARY OF THE PAST: 
      ${summary}
      RECENT CONVERSATION HISTORY:
      ${recentHistory.join("\n")}
      `;
      const question = `What's the NPC's response?`;
      const prompt = coercedJSONPrompt({ context, question });

      // const response = await generateResponseGroq(prompt);
      const raw = await generateResponseOllama(prompt);
      const response = parseJSONResponse(raw);
      // console.log("NPC WORKER RESPONSE", response);
      await output.emit(response);
    }
  },
});

export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    const recentHistory: string[] = [];
    let summaryOfAllThePast = "";

    (async () => {
      for await (const data of input("npc")) {
        recentHistory.push(`${"NPC"}: ${data}`);
        // keep accululating the history until it reaches 10
        // then take the oldest 5 and fold it into the summary

        if (recentHistory.length > 20) {
          const oldest = recentHistory.splice(0, 10);
          const prompt = `Summarize the previous summary and the recent conversation history into a single summary.
  SUMMARY OF PAST CONVERSATION:
  ${summaryOfAllThePast}
  RECENT CONVERSATION HISTORY:
  ${oldest.join("\n")}
  
  NEW SUMMARY:
          `;
          summaryOfAllThePast = await generateResponseOllama(prompt);
        }
        // console.log(
        //   "SUMMARY WORKER OUTPUT",
        //   summaryOfAllThePast,
        //   recentHistory
        // );
        await output("for-player").emit({
          summary: summaryOfAllThePast,
          recentHistory: recentHistory,
        });
      }
    })();

    for await (const data of input("player")) {
      recentHistory.push(`Human Player: ${data}`);
      // keep accululating the history until it reaches 10
      // then take the oldest 5 and fold it into the summary

      if (recentHistory.length > 20) {
        const oldest = recentHistory.splice(0, 10);
        const prompt = `Summarize the previous summary and the recent conversation history into a single summary.
  SUMMARY OF PAST CONVERSATION:
  ${summaryOfAllThePast}
  RECENT CONVERSATION HISTORY:
  ${recentHistory.join("\n")}
  
  NEW SUMMARY:
          `;
        summaryOfAllThePast = await generateResponseOllama(prompt);
      }
      console.log("SUMMARY WORKER OUTPUT", summaryOfAllThePast, recentHistory);
      await output("for-npc").emit({
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
        temperature: 0.8,
      },
      stream: true,
      model: CONVO_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    let message = "";
    // process.stdout.write("Response:  ");

    for await (const part of response) {
      process.stdout.write(
        part.message.content.replace("\n", " ").replace("\r", " ")
      );
      message += part.message.content;
    }
    // erase all of what was written
    // Move the cursor to the beginning of the line
    process.stdout.write("\r");
    // process.stdout.write("\r\n");
    // Clear the entire line
    process.stdout.write("\x1b[2K");
    return message;
  } catch (e) {
    console.log(e);
    await sleep(200);
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
      temperature: 0.5,
    });
    // let message = "";
    // process.stdout.write("Response:  ");

    // for await (const part of response) {
    //   message += part.choices[0].delta.content!;
    // }
    let message = response.choices[0].message.content;
    process.stdout.write(message);

    return message;
  } catch (e) {
    console.log(e);
    await sleep(1000);
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}

function coercedJSONPrompt({
  context,
  question,
}: {
  context: string;
  question: string;
}) {
  const prompt = `[INST]
  ${context}
      
      You must format your output as a JSON value that adheres to a given "JSON Schema" instance.
      
     
      Here is an example JSON that  yur output must adhere to:
      {
        "nextResponse": "[Your response here]",
        "quit": false | true // true indicates that the conversation is over
      }
      
      
      Please provide your response based the context and the question below:
      ${question}
      [/INST]`;
  return prompt;
}
