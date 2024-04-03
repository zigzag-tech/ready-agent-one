import { generateResponseOllama } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { GameState } from "./summarySpec";
import {
  charactersEnum,
  gameStateSchema,
  scenePropsSchema,
} from "../common/gameStateSchema";
import { z } from "zod";

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: gameStateSchema,
  output: gameStateSchema,
});

export const supervisorWorker = supervisorSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const state of input) {
      // if the conversation has gone too long, change context by producing the next scene
      if (!conversationTooLong(state)) {
        await output.emit(state);
      } else {
        const previousScenesPrompt = `Write a summary of everything listed below.
${
  state.previous
    ? `\n### SUMMARY FOR PAST PLOT (SCENES 1 - ${state.sceneNumber - 1})\n${
        state.previous.summary
      }\n`
    : "\n"
}
### CURRENT SCENE PLOT
${state.current.summary}

### LAST FEW LINES OF CONVERSATION
${JSON.stringify(state.recentHistory)}

Instructions:
Keep the response under 200 words.`;
        // console.log(
        //   "supervisorSpec previousScenesPrompt",
        //   previousScenesPrompt
        // );
        const previousScenesSummary =
          (await generateResponseOllama(previousScenesPrompt)) || "";
        // console.log(
        //   "supervisorSpec previousScenesSummary",
        //   previousScenesSummary
        // );
        const newSceneNumber = state.sceneNumber + 1;
        const newTopicPrompt = `You are a script writing assistant. Your job is to write a new scene in the story based on the context provided.
### SUMMARY OF PAST PLOT (SCENES 1 - ${state.sceneNumber})
${previousScenesSummary}

### LAST FEW LINES OF CONVERSATION AT THE END OF SCENE ${state.sceneNumber}
${JSON.stringify(state.recentHistory)}

### INSTRUCTIONS
- Write the plot for new scene ${newSceneNumber}.
- Do not introduce new characters. Limit the plot to only be about interactions and adventure among [${Object.keys(
          charactersEnum.Values
        ).join(", ")}].
- Be dramatic and creative.
- The new scene should have a new setting or twist.
- Keep the response under 30 words.
`;
        // console.log("supervisorSpec newTopicPrompt", newTopicPrompt);
        // console.log("SUPERVISOR: GENERATING NEW SCENE");
        const newTopic = (await generateResponseOllama(newTopicPrompt)) || "";
        // console.log("supervisorSpec newTopic", newTopic);

        const sceneGenPrompt = `${PROPS_INST_AND_EXAMPLE_1}
${PROPS_EXAMPLE_2}
[INST]
SCENE PROVIDED:
${newTopic}
[/INST]`;
        const scene = (await generateResponseOllama(sceneGenPrompt)) || "";
        const props = parseJSONResponse(scene);
        console.log("supervisorSpec props", scene);

        const newState: GameState = {
          previous: {
            summary: previousScenesSummary,
          },
          current: {
            summary: newTopic,
            props,
          },
          sceneNumber: newSceneNumber,
          totalNumOfLines: 0,
          // only keep the last 3 lines of conversation
          // recentHistory: state.recentHistory.slice(-3),
          recentHistory: [],
        };

        await output.emit(newState);
      }
    }
  },
});

function conversationTooLong(state: GameState) {
  return state.totalNumOfLines > 12;
}

function parseJSONResponse(raw: string | null) {
  type Props = z.infer<typeof scenePropsSchema>;
  if (!raw) return [] as Props;
  try {
    const responseJson = JSON.parse(raw.trim()) as { props: Props };
    return responseJson.props;
  } catch (e) {
    console.log("Error parsing response", e, "raw:", raw);
    return [] as Props;
  }
}

const PROPS_INST_AND_EXAMPLE_1 = `<s>[INST]You are a scene writing assistant.
Instructions:
Your job is to write the type, name, description, and position of objects mentioned in the SCENE PROVIDED.
- position should be only one of "north", "west", "south", "east".
- type should be only one of the "person" or "object".
- name and description should be a string.
Respond with only the JSON and do NOT explain.

SCENE PROVIDED:
In a cozy room, Emily sits, a black cat curled at her feet. She tries to get the cat's attention with a toy.

The above example would output the following json:
[/INST]
${JSON.stringify(
  {
    props: [
      {
        type: "person",
        name: "emily",
        description: "emily the cat lover.",
        position: "north",
      },
      {
        type: "object",
        name: "cat",
        description: "A black cat.",
        position: "west",
      },
      {
        type: "object",
        name: "cat toy",
        description: "A round toy with a bell inside.",
        position: "north",
      },
    ],
  },
  null,
  2
)}
</s>`;

const PROPS_EXAMPLE_2 = `<s>[INST]
SCENE PROVIDED:
In the ancient ruins, a group of 3 adventurers, Jack, Tracy, and Indiana, entered a dark chamber. They found a treasure chest and a skeleton.
[/INST]
${JSON.stringify(
  {
    props: [
      {
        type: "person",
        name: "jack",
        description: "Jack the adventurer.",
        position: "north",
      },
      {
        type: "person",
        name: "tracy",
        description: "Tracy the adventurer.",
        position: "south",
      },
      {
        type: "person",
        name: "indiana",
        description: "Indiana the adventurer.",
        position: "east",
      },
      {
        type: "object",
        name: "treasure chest",
        description: "A large treasure chest.",
        position: "east",
      },
      {
        type: "object",
        name: "skeleton",
        description: "A human skeleton.",
        position: "north",
      },
    ],
  },
  null,
  2
)}
</s>`;
