import pkg from "@livestack/core";
import { z } from "zod";
;
import { generateResponseOllama } from "./generateResponseOllama";
import { supervisorSpec } from "./supervisorSpec";
import { GameState, gameStateSchema, summarySpec } from "./summarySpec";
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
  input: gameStateSchema,
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
    for await (const state of input) {
      const response = await maybeGenPrompt("human", state);
      if (!response) {
        continue;
      } else {
        await output.emit(parseJSONResponse(response));
      }
    }
  },
});

const LABEL_BY_ROLE = {
  human: "Human Player",
  npc: "NPC",
};

const DIRECTIVE_BY_ROLE = {
  human:
    "You are a conversation writing assistant. Your job is to write what the human player should say next based on the context provided.",
  npc: "You are a conversation writing assistant. Your job is play the role of an NPC named Jeremy with a sarcastic streak and write what Jeremy should say next based on the context provided.",
};

async function maybeGenPrompt(role: "human" | "npc", state: GameState) {
  const { recentHistory } = state;

  if (recentHistory[recentHistory.length - 1].startsWith(LABEL_BY_ROLE[role])) {
    return null;
  }

  const context = `${DIRECTIVE_BY_ROLE[role]}
Below is a conversation that happened in an open world game. 

${genContext(state)}
  
### INSTRUCTIONS
- Response with JSON { "nextMessage": "[your message]" }
- Replace [your message] with what the player should say next.
- DO NOT repeat what's already in the CONVERSATION HISTORY. 
- Write only the JSON and nothing else.
  `;
  const response = await generateResponseOllama(context);
  return response;
}

function genContext(state: GameState) {
  const { current, previous, recentHistory } = state;
  return `### PREVIOUS CHAPTER
  Previously: ${previous.summary}
  
  ### CURRENT CHAPTER
  What Happened so far:
  ${current.summary}
  
  ### CONVERSATION HISTORY
  ${
    recentHistory.length > 0
      ? recentHistory.join("\n")
      : "No conversation history yet."
  }`;
}

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
    for await (const state of input) {
      const response = await maybeGenPrompt("npc", state);
      if (!response) {
        continue;
      } else {
        await output.emit(parseJSONResponse(response));
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
