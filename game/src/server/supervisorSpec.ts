import {
  generateJSONResponseOllamaByMessages,
  generateResponseOllamaByMessages,
} from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import {
  GameState,
  charactersEnum,
  gameStateSchema,
  scenePropsSchema,
} from "../common/gameStateSchema";
import { z } from "zod";
import { Message } from "ollama";
// import { characterProps } from "../common/alien-cave";
import { petStoreCharacterProps } from "../common/pet-store";
import { genPropsPrompt } from "./genPromptUtils";

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: gameStateSchema,
  output: {
    default: gameStateSchema.extend({ releaseChange: z.boolean() }),
    "new-chapter-prompt": z.string(),
    "new-chapter-raw": z.string(),
  },
});

export const supervisorWorker = supervisorSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const state of input) {
      // if the conversation has gone too long, change context by producing the next scene
      if (!conversationTooLong(state)) {
        await output.emit({ ...state, releaseChange: false });
      } else {
        const messages: Message[] = [
          {
            role: "system",
            content: `
You are a helpful assistant. Write a summary of everything listed by the user.
`,
          },
          {
            role: "user",
            content: `
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
Keep the response under 200 words.
`,
          },
        ];

        const previousScenesSummary =
          (await generateResponseOllamaByMessages(messages)) || "";

        const newSceneNumber = state.sceneNumber + 1;
        const newTopicPrompt = `
SUMMARY OF PAST PLOT (SCENES 1 - ${state.sceneNumber + 1})
${previousScenesSummary}
${state.current.summary}

LAST FEW LINES OF CONVERSATION AT THE END OF SCENE ${state.sceneNumber}
${JSON.stringify(state.recentHistory)}

INSTRUCTIONS
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

        const newTopicMessages: Message[] = [
          {
            role: "system",
            content: `
            You are a script writing assistant. Your job is to write a new scene in the story based on the context provided.
Instructions:
- Make a detailed plot, around 200 words.
- Respone with only the plot and do NOT explain.
`,
          },
          {
            role: "user",
            content: newTopicPrompt,
          },
        ];
        await output("new-chapter-prompt").emit(newTopicPrompt);
        const newTopic =
          (await generateResponseOllamaByMessages(newTopicMessages)) || "";
        await output("new-chapter-raw").emit(newTopic);
        // console.log("supervisorSpec newTopic", newTopic);

        const propsGenMessages = genPropsPrompt(newTopic);
        // const scene =
        //   (await generateResponseOllamaByMessages(sceneGenMessages)) || "";
        // const propsMaybeMissingPeople = parseJSONResponse(scene);
        // console.error("supervisorSpec props", scene);
        const propsMaybeMissingPeople =
          (await generateJSONResponseOllamaByMessages({
            messages: propsGenMessages,
            schema: z.object({ props: scenePropsSchema }),
            schemaName: "scenePropsSchema",
          })) as { props: z.infer<typeof scenePropsSchema> };

        const existingCharacters = propsMaybeMissingPeople.props.filter(
          (prop) =>
            prop.type === "person" &&
            petStoreCharacterProps.map((p) => p.name).includes(prop.name)
        );

        // add any missing characters
        const missingCharacters = petStoreCharacterProps.filter(
          (p) => !existingCharacters.find((c) => c.name === p.name)
        );
        const newProps = [
          ...propsMaybeMissingPeople.props,
          ...missingCharacters,
        ];

        const nextSceneState: GameState = {
          previous: {
            summary: previousScenesSummary,
          },
          current: {
            summary: newTopic,
            props: newProps,
          },
          sceneNumber: newSceneNumber,
          totalNumOfLines: 0,
          // only keep the last 3 lines of conversation
          // recentHistory: state.recentHistory.slice(-3),
          recentHistory: [],
        };

        await output.emit({ ...nextSceneState, releaseChange: true });
      }
    }
  },
});

function conversationTooLong(state: GameState) {
  return state.totalNumOfLines > 10;
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
