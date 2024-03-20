import { generateResponseOllama } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { GameState } from "./summarySpec";
import { charactersEnum, gameStateSchema } from "../common/gameStateSchema";

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
    ? `### SUMMARY FOR PAST PLOT (SCENES 1 - ${state.sceneNumber - 1})\n${
        state.previous.summary
      }`
    : ""
}

### CURRENT SCENE PLOT
${state.current.summary}

        `;
        // console.log("SUPERVISOR: SUMMARIZING PREVIOUS SCENE");
        const previousScenesSummary =
          (await generateResponseOllama(previousScenesPrompt)) || "";
        const newSceneNumber = state.sceneNumber + 1;
        const newTopicPrompt = `You are a script writing assistant. Your job is to write a new scene in the story based on the context provided.
### SUMMARY OF PAST PLOT (SCENES 1 - ${state.sceneNumber})
${previousScenesSummary}

### LAST FEW LINES OF CONVERSATION (FOR YOUR REFERENCE)
${state.recentHistory.join("\n")}

### INSTRUCTIONS
- Write the plot for new scene ${newSceneNumber}.
- Do not introduce new characters. Limit the plot to only be about interactions and adventure among [${Object.keys(
          charactersEnum.Values
        ).join(", ")}].
- Be dramatic and creative.
- The new scene should have a new setting or twist.
- Keep the response under 30 words.
`;
        // console.log("SUPERVISOR: GENERATING NEW SCENE");
        const newTopic = (await generateResponseOllama(newTopicPrompt)) || "";

        const newState: GameState = {
          previous: {
            summary: previousScenesSummary,
          },
          current: {
            summary: newTopic,
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
