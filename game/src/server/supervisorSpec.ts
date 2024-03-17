import { generateResponseOllama } from "./generateResponseOllama";
import { stringZ } from "./conversationWorkers";
import { JobSpec } from "@livestack/core";
import { GameState, gameStateSchema } from "./summarySpec";

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: gameStateSchema,
  output: gameStateSchema,
});

export const supervisorWorker = supervisorSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const state of input) {
      // if the conversation has gone too long, change context by producing the next chapter
      if (conversationTooLong(state)) {
        const previousChaptersPrompt = `Write a consolidated summary of the previous chapters, current chapter, and the last few lines of conversation.
### PREVIOUS CHAPTER SUMMARY
${state.previous.summary}

### CURRENT CHAPTER SUMMARY
${state.current.summary}
### LAST FEW LINES OF CONVERSATION
${state.recentHistory.join("\n")}
        `;
        const previousChaptersSummary = await generateResponseOllama(
          previousChaptersPrompt
        );

        const newTopicPrompt = `You are a script writing assistant. Your job is to write a new chapter in the story based on the context provided.
### WHAT HAPPENED PREVIOUSLY
${previousChaptersSummary}

### INSTRUCTIONS
- Be dramatic and creative.
- The new chapter should have a new setting or twist.
`;
        const newTopic = await generateResponseOllama(newTopicPrompt);

        const newState: GameState = {
          previous: {
            summary: previousChaptersSummary,
          },
          current: {
            summary: newTopic,
          },
          totalNumOfLines: 0,
          // only keep the last 3 lines of conversation
          recentHistory: state.recentHistory.slice(-3),
        };

        await output.emit(newState);
      }
    }
  },
});

function conversationTooLong(state: GameState) {
  return state.totalNumOfLines > 10;
}
