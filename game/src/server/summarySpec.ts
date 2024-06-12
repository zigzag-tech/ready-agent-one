import { generateResponseOllamaByMessages } from "./generateResponseOllama";
import { JobSpec } from "@livestack/core";
import { GameState, gameStateSchema } from "../common/gameStateSchema";
import { Message } from "ollama";
import { genStateChangesByActions } from "./gameEngine";
import { characterOutputSchema } from "../common/characterOutputSchema";

export const summarySpec = JobSpec.define({
  name: "SUMMARY_WORKER",
  input: gameStateSchema,
  output: gameStateSchema,
});
export const summaryWorker = summarySpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const currentState of input) {
      const SUMMARIZE_THRESHOLD = 9;
      // keep accululating the history until it reaches 10
      // then take the oldest 5 and fold it into the summary
      if (currentState.recentHistory.length > SUMMARIZE_THRESHOLD * 2) {
        const oldest = currentState.recentHistory.splice(
          0,
          Math.round(SUMMARIZE_THRESHOLD)
        );
        const dummyState: GameState = {
          current: {
            summary:
              "The world has been in chaos for a long time. Lizard war has been going on for centuries. Now only two lizards remain.",
            props: [
              {
                name: "lizard-warrior",
                type: "person",
                description: "a lizard warrior",
                position: {
                  x: 0,
                  y: 0,
                },
              },
              {
                name: "lizard-nihilist",
                type: "person",
                description: "a lizard nihilist",
                position: {
                  x: 1,
                  y: 1,
                },
              },
              {
                name: "flames",
                type: "object",
                description: "The fire of doom",
                position: {
                  x: 2,
                  y: 2,
                },
              },
            ],
          },
          sceneNumber: 1,
          recentHistory: [
            {
              subject: "lizard-warrior",
              thinking: "I am the last of my kind. I must fight to survive.",
              action: "stand",
              target: null,
              message: "Grrrrr! Fear me! I am the lizard warrior!",
              stateChanges: [],
            },
            {
              subject: "lizard-nihilist",
              thinking:
                "There is no point for us lizard to exist. I must stop lizard-one.",
              message: "You need to die for our species to stop existing.",
              action: "move",
              target: "[0,0]",
              stateChanges: [
                {
                  subject: "lizard-nihilist",
                  type: "location",
                  fromLocation: {
                    x: 0,
                    y: 0,
                  },
                  toLocation: {
                    x: 1,
                    y: 1,
                  },
                },
              ],
            },
          ],
          totalNumOfLines: 0,
        };
        const messages: Message[] = [
          {
            role: "system",
            content: `
Summarize the previous summary and the recent conversation history into a single summary.
  
INSTRUCTIONS
- Keep the response under 50 words.
- Return the JSON object and nothing else.
`,
          },
          // 1-shot example
          {
            role: "user",
            content: `
SUMMARY OF PAST CONVERSATION:
${dummyState.current.summary}
RECENT CONVERSATION HISTORY:
[
${dummyState.recentHistory.map((h) => `${JSON.stringify(h)}`).join("\n")}
]

UPDATED SUMMARY:
`,
          },
          {
            role: "assistant",
            content: `
{ 
  "summary": "After a long-drawn-out war among lizards the world has only two lizards left in the fames of doom. Lizard the warrior wants to survive, while lizard the nihilist wants their species to stop existing. Lizard the nihilist is charging towards lizard the warrior." 
}
`,
          },
        ];

        const { summary: newSummary } = JSON.parse(
          (await generateResponseOllamaByMessages(messages))!
        ) as { summary: string };
        currentState.current.summary = newSummary;
      }
      // console.log(
      //   "SUMMARY WORKER OUTPUT",
      //   currentState.current.summary,
      //   currentState.recentHistory
      // );

      currentState.totalNumOfLines += 1;
      // console.clear();
      await output.emit(currentState);
    }
  },
});
