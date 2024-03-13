import pkg from "@livestack/core";
import ollama from "ollama";
import Groq from "groq-sdk";
import { z } from "zod";
import { summaryPlusHistorySchema } from "../common/summaryPlusHistorySchema";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

const CONVO_MODEL = "mistral";

const stringZ = z.string();

export const playerWorkerSpec = JobSpec.define({
  name: "PLAYER_WORKER",
  input: summaryPlusHistorySchema,
  output: stringZ,
});
export const npcWorkerSpec = JobSpec.define({
  name: "NPC_WORKER",
  input: { default: summaryPlusHistorySchema, supervision: stringZ },
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
    "for-supervisor": summaryPlusHistorySchema,
    "for-player": summaryPlusHistorySchema,
  },
});

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: summaryPlusHistorySchema,
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
        input: "default",
      },
    }),
    conn({
      from: {
        spec: summarySpec,
        output: "for-supervisor",
      },
      to: {
        spec: supervisorSpec,
      },
    }),
    conn({
      from: {
        spec: supervisorSpec,
      },
      to: {
        spec: npcWorkerSpec,
        input: "supervision",
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

      const context = `Below is a conversation that happened in an open world game. 

### BACKGROUND
${summary}

### CONVERSATION HISTORY
${
  recentHistory.length > 0
    ? recentHistory.join("\n")
    : "No conversation history yet."
}
      
### INSTRUCTIONS

Your job is to detect if the conversation has come to an end.
If the CONVERSATION HISTORY looks like either of them have said good luck or farewell, respond with JSON { "ended": true }. Otherwise, response with JSON { "nextMessage": "[your message]" }
Replace [your message] with what the player should say next.
DO NOT repeat what's already in the CONVERSATION HISTORY. Write only the JSON and nothing else.
      `;
      // const question = `What's the human player's response?`;
      // const prompt = coercedJSONPrompt({ context, question });
      // const response = await generateResponseGroq(prompt);
      // console.log(context);
      const response = await generateResponseOllama(context);
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
    const responseJson = JSON.parse(responseJsonString) as
      | {
          nextMessage: string;
        }
      | {
          ended: true;
        };
    if ((responseJson as { ended: true }).ended) {
      // console.log("PLAYER WORKER RESPONSE", response);
      return "[The human player has decided to quit the conversation.]";
    } else {
      return (
        responseJson as {
          nextMessage: string;
        }
      ).nextMessage;
    }
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return "Sorry, I am not able to respond right now. Please try again later.";
  }
}

export const npcWorker = npcWorkerSpec.defineWorker({
  processor: async ({ input, output, jobId }) => {
    let topicTracker = { currentTopic: "", isNewTopic: false };
    (async () => {
      for await (const data of input("supervision")) {
        if (data !== topicTracker.currentTopic) {
          topicTracker = { currentTopic: data, isNewTopic: true };
        }
      }
    })();

    for await (const { summary, recentHistory } of input("default")) {
      // console.log("NPC WORKER INPUT", summary, recentHistory);
      // if the last message was from the player, then the player should not respond
      if (recentHistory[recentHistory.length - 1].startsWith("NPC")) {
        continue;
      }

      console.log(topicTracker);
      const context = generateContextByTopicSignal({
        summary,
        recentHistory,
        topicTracker,
      });

      topicTracker.isNewTopic && (topicTracker.isNewTopic = false);
      // const question = `What's the NPC's response?`;
      // const prompt = coercedJSONPrompt({ context, question });

      // const response = await generateResponseGroq(prompt);
      // console.log(context);
      const raw = await generateResponseOllama(context);
      const response = parseJSONResponse(raw);
      // console.log("NPC WORKER RESPONSE", response);
      await output.emit(response);
    }
  },
});

const generateContextByTopicSignal = ({
  summary,
  recentHistory,
  topicTracker,
}: {
  summary: string;
  recentHistory: string[];
  topicTracker: { currentTopic: string; isNewTopic: boolean };
}) => {
  if (topicTracker.isNewTopic) {
    const context = `You are an NPC. Your job is to start a conversation with a human player based on the topic supplied:
### TOPIC
${topicTracker.currentTopic}

### INSTRUCTIONS

Response with JSON { "nextMessage": "[your message]" }.
Replace [your message] with what the NPC should say next. The NPC has a somewhat sarcastic personality but should also be helpful and not too cryptic.
Write only the JSON and nothing else. Keep response under 20 words.
`;

    return context;
  } else {
    const context = `Below is a conversation that happened in an open world game. 

### BACKGROUND
${summary}

### CONVERSATION HISTORY
${
  recentHistory.length > 0
    ? recentHistory.join("\n")
    : "No conversation history yet."
}
      
### INSTRUCTIONS

Detect if the conversation has come to an end.
If the CONVERSATION HISTORY looks like either of them have said good luck or farewell, respond with JSON { "ended": true }. Otherwise, response with JSON { "nextMessage": "[your message]" }
Replace [your message] with what the NPC should say next. The NPC has a somewhat sarcastic personality but should also be helpful and not too cryptic.
DO NOT repeat what's already in the CONVERSATION HISTORY. Write only the JSON and nothing else.
Keep response under 20 words.
`;
    return context;
  }
};
export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    const recentHistory: string[] = [];
    let summaryOfAllThePast = "";
    let counter = 0;

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
        console.log(
          "SUMMARY WORKER OUTPUT",
          summaryOfAllThePast,
          recentHistory
        );
        counter++;
        await output("for-player").emit({
          summary: summaryOfAllThePast,
          recentHistory: recentHistory,
          counter,
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
      counter++;
      await output("for-npc").emit({
        summary: summaryOfAllThePast,
        recentHistory: recentHistory,
        counter,
      });
      await output("for-supervisor").emit({
        summary: summaryOfAllThePast,
        recentHistory: recentHistory,
        counter,
      });
    }
  },
});

export const supervisorWorker = supervisorSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const data of input) {
      // if data.counter is a multiple of 10, then propose a new topic
      if (data.counter % 2 === 0 || data.counter % 3 === 0) {
        const prompt = `Propose a new topic for the conversation. Keep it under 20 words.`;
        // SUMMARY OF PAST CONVERSATION:
        // ${data.summary}
        // RECENT CONVERSATION HISTORY:
        // ${data.recentHistory.join("\n")}

        // NEW TOPIC:
        //         `;
        const newTopic = await generateResponseOllama(prompt);
        console.log("SUPERVISOR WORKER OUTPUT", newTopic);
        await output.emit(newTopic);
      }
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
