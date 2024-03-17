import pkg from "@livestack/core";
import { z } from "zod";
;
import { generateResponseOllama } from "./generateResponseOllama";
import { supervisorSpec } from "./supervisorSpec";
import { gameStateSchema, summarySpec } from "./summarySpec";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

export const CONVO_MODEL = "dolphin-mistral";
export const stringZ = z.string();
export const playerWorkerSpec = JobSpec.define({
  name: "PLAYER_WORKER",
  input: gameStateSchema,
  output: stringZ,
});

export const npcWorkerSpec = JobSpec.define({
  name: "NPC_WORKER",
  input: { summary: gameStateSchema, supervision: stringZ },
  output: stringZ,
});

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  connections: [
    conn({
      from: playerWorkerSpec,
      to: {
        spec: summarySpec,
        input: "player",
      },
    }),
    conn({
      from: npcWorkerSpec,
      to: {
        spec: summarySpec,
        input: "npc",
      },
    }),
    conn({
      from: summarySpec,
      to: playerWorkerSpec,
    }),
    conn({
      from: summarySpec,
      to: npcWorkerSpec,
    }),
    conn({
      from: summarySpec,
      to: supervisorSpec,
    }),
    conn({
      from: supervisorSpec,
      to: {
        spec: summarySpec,
        input: "supervision",
      },
    }),
  ],
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
        summary: "npc-input",
        supervision: "npc-supervision",
      },
      output: {
        default: "npc-talk",
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
Response with JSON { "nextMessage": "[your message]" }
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

    for await (const { data, tag } of input.merge("supervision", "summary")) {
      switch (tag) {
        case "supervision": {
          if (data !== topicTracker.currentTopic) {
            topicTracker = { currentTopic: data, isNewTopic: true };
          }
          break;
        }
        case "summary": {
          // console.log("NPC WORKER INPUT", summary, recentHistory);
          // if the last message was from the player, then the player should not respond
          const { summary, recentHistory } = data;
          if (recentHistory[recentHistory.length - 1].startsWith("NPC")) {
            continue;
          }

          const context = generateContextByTopicSignal({
            summary,
            recentHistory,
            topicTracker,
          });

          topicTracker.isNewTopic && (topicTracker.isNewTopic = false);
          const raw = await generateResponseOllama(context);
          const response = parseJSONResponse(raw);
          // console.log("NPC WORKER RESPONSE", response);
          await output.emit(response);
          break;
        }
        default: {
          throw new Error(`Invalid tag: ${tag} in npcWorker.`);
        }
      }
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
Response with JSON { "nextMessage": "[your message]" }
Replace [your message] with what the NPC should say next. The NPC has a somewhat sarcastic personality but should also be helpful and not too cryptic.
DO NOT repeat what's already in the CONVERSATION HISTORY. Write only the JSON and nothing else.
Keep response under 20 words.
`;
    return context;
  }
};

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
