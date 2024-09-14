import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import {
  GameState,
  POSSIBLE_LOCATIONS,
  gameStateSchema,
  locationSchema,
  scenePropsSchema,
} from "../common/gameStateSchema";
import { z } from "zod";
import { Message } from "ollama";
// import { characterProps } from "../common/alien-cave";
import { petStoreCharacterProps } from "../common/pet-store";
import {
  extractAllTaggedContent,
  parseRawContentToJSON,
  parseRawCriterionContentToJSON,
} from "./genPromptUtils";
import { genPropsAndCriteriaPrompt } from "./genPropsAndCriteriaPrompt";

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: gameStateSchema,
  output: {
    default: gameStateSchema.extend({ stateHasChanged: z.boolean() }),
    "new-chapter-prompt": z.string(),
    "new-scene-and-goal-raw": z.string(),
  },
});

export const supervisorWorker = supervisorSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const state of input) {
      const criteriaMet = criteriaHaveBeenMet(state);
      // if the conversation has gone too long, change context by producing the next scene
      if (!criteriaMet) {
        await output.emit({ ...state, stateHasChanged: false });
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

`;
        // console.log("supervisorSpec newTopicPrompt", newTopicPrompt);
        // console.log("SUPERVISOR: GENERATING NEW SCENE");

        const newTopicMessages: Message[] = [
          {
            role: "system",
            content: `
You are a game script writing assistant. Your job is to write a scene based on an (optional) previous summary, along with an goal that, when achieved, will trigger successful completion of the scene.

Types of goals must be one of the following:
- One or more characters must reach a specific destination.
- One or more characters must interact with a specific object.
- One or more characters must perform a specific action.

Requirements:
- The description of the scene must be around 200 words.
- Restrict the characters to only Morgan, Jeremy, and Guy.
- Do not introduce new characters.
- Be dramatic and creative.
- The new scene should have a new setting or twist.
- Keep the response under 30 words.

Example:
<scene>
In a dark alley, three explorers, Morgan, Jeremy and Guy are on a quest to find the lost treasure of the ancient city of Zor. They are being pursued by a group of bandits. The explorers must reach the end of the alley and find the hidden entrance to the city before the bandits catch up to them.
</scene>
<goal>
All explorers must reach the entrance of the city at the end of the alley.
</goal>

`,
          },
          {
            role: "user",
            content: newTopicPrompt,
          },
        ];
        await output("new-chapter-prompt").emit(newTopicPrompt);
        const newSceneAndGoalRaw =
          (await generateResponseOllamaByMessages(newTopicMessages)) || "";
        await output("new-scene-and-goal-raw").emit(newSceneAndGoalRaw);
        const newGoal =
          extractAllTaggedContent({
            input: newSceneAndGoalRaw,
            startTag: "<goal>",
            endTag: "</goal>",
          })[0] || "";
        // console.log("supervisorSpec newTopic", newTopic);

        const propsGenMessages = genPropsAndCriteriaPrompt(newSceneAndGoalRaw);

        const rawMessage = await generateResponseOllamaByMessages(
          propsGenMessages
        );

        if (!rawMessage) {
          throw new Error("Ollama response is empty.");
        }

        const propsMaybeMissingPeople = {
          props: [] as z.infer<typeof scenePropsSchema>,
        };

        const rawObjContents = extractAllTaggedContent({
          input: rawMessage,
          startTag: "<obj>",
          endTag: "</obj>",
        });

        const parsedProps = rawObjContents.map(
          (content) => parseRawContentToJSON(content) as any
        );
        propsMaybeMissingPeople.props.push(...parsedProps);

        const rawCriterionContents = extractAllTaggedContent({
          input: rawMessage,
          startTag: "<criterion>",
          endTag: "</criterion>",
        });

        const parsedCriteria = rawCriterionContents.map(
          (content) => parseRawCriterionContentToJSON(content, newGoal) as any
        );

        // console.log("parsedCriteria", parsedCriteria);

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
        ].map((prop) => {
          if (
            POSSIBLE_LOCATIONS.includes(
              prop.position as z.infer<typeof locationSchema>
            )
          ) {
            return prop;
          } else {
            return { ...prop, position: "center" as const };
          }
        });

        const nextSceneState: GameState = {
          previous: {
            summary: previousScenesSummary,
          },
          current: {
            summary: newSceneAndGoalRaw,
            props: newProps,
            criteria: parsedCriteria,
          },
          sceneNumber: newSceneNumber,
          totalNumOfLines: 0,
          // only keep the last 3 lines of conversation
          // recentHistory: state.recentHistory.slice(-3),
          recentHistory: [],
        };

        await output.emit({ ...nextSceneState, stateHasChanged: true });
      }
    }
  },
});

function conversationTooLong(state: GameState) {
  return state.totalNumOfLines > 9;
}

function criteriaHaveBeenMet(state: GameState) {
  // mechanical way to check if criteria have been met
  return state.current.criteria.every((criterion) => {
    if (criterion.type === "is_at") {
      return state.current.props.some(
        (prop) =>
          prop.type === "person" &&
          prop.name === criterion.character &&
          prop.position === criterion.object
      );
    } else if (criterion.type === "performed") {
      return state.recentHistory.some(
        (history) =>
          history.subject === criterion.character &&
          history.action === criterion.action &&
          (!criterion.target || history.target === criterion.target)
      );
    } else {
      throw new Error("Invalid criterion type");
    }
  });
}
