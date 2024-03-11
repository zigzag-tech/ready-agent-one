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

      const prompt = `      
      
      You are a game player. You will receive a conversation history and you need to respond to it. Keep the response under 20 words. 
      If you think the conversation is going nowhere, you can response "quit" to end the conversation. 
      Avoid repeating what was already said in the conversation. Add something new to the conversation for your response.

      SUMMARY OF PAST CONVERSATION: 
      ${summary}
      RECENT CONVERSATION HISTORY:
      ${recentHistory.join("\n")}
      
      You must format your output as a JSON value that adheres to a given "JSON Schema" instance.
      
      "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
      
      For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
      would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
      Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.
      
      Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!
      
      Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
      \`\`\`
      {"type":"object","properties":{"humanPlayerResponse":{"type":"string","description":"the response of the human player"},"quit":{"type":"boolean","description":"whether the human player decides to quit."}}},"required":["humanPlayerResponse", "quit"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}
      \`\`\`
      What's the human player's response?
      `;
      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);
      try {
        // heuristic to find the {} enclosure substring
        const start = response.indexOf("{");
        const end = response.lastIndexOf("}") + 1;
        const responseJsonString = response.slice(start, end);
        const responseJson = JSON.parse(responseJsonString) as {
          humanPlayerResponse: string;
          quit: boolean;
        };
        if (!responseJson.quit) {
          // console.log("PLAYER WORKER RESPONSE", response);
          output.emit(responseJson.humanPlayerResponse);
        }
      } catch (e) {
        console.log("Error parsing response", e);
        await output.emit(
          "Sorry, I am not able to respond right now. Please try again later."
        );
      }
    }
  },
});

export const npcWorker = npcWorkerSpec.defineWorker({
  processor: async ({ input, output, jobId }) => {
    for await (const { summary, recentHistory } of input) {
      // console.log("NPC WORKER INPUT", summary, recentHistory);
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
      
      NPC:
      `;

      // const response = await generateResponseGroq(prompt);
      const response = await generateResponseOllama(prompt);
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
    // process.stdout.write("Response:  ");

    for await (const part of response) {
      process.stdout.write(part.message.content);
      message += part.message.content;
    }
    // erase all of what was written
    // Move the cursor to the beginning of the line
    process.stdout.write("\r");

    // Clear the entire line
    process.stdout.write("\x1b[2K");
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
