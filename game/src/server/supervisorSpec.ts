import { summaryPlusHistorySchema } from "../common/summaryPlusHistorySchema";
import { generateResponseOllama } from "./generateResponseOllama";
import { stringZ } from "./conversationWorkers";
import { JobSpec } from "@livestack/core";

export const supervisorSpec = JobSpec.define({
  name: "SUPERVISOR_WORKER",
  input: summaryPlusHistorySchema,
  output: stringZ,
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
