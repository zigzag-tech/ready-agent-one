import pkg from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { npcWorker, playerWorker, workflow } from "./conversationWorkers";
import { v4 } from "uuid";
const { ZZEnv, JobSpec } = pkg;

ZZEnv.setGlobal(
  new ZZEnv({
    projectId: GAME_SPEC_NAME + new Date().getTime(),
  })
);

// if (module === require.main) {
(async () => {
  await playerWorker.startWorker();
  await npcWorker.startWorker();
  await workflow.startWorker();
  // feed input to the playerWorker, playerWorker's output as input to npcWorker
  const initialInput = "Hello, let's talk about something!";

  const { input, output } = await workflow.enqueueJob({});
  await input("player-input").feed(initialInput);

  (async () => {
    for await (const data of output("player-talk")) {
      console.log("player:", data.data);
    }
  })();
  (async () => {
    for await (const data of output("npc-talk")) {
      console.log("npc:", data.data);
    }
  })();

  // const { output: playerOutput, input: playerInput } =
  //   await playerWorker.enqueueJob({
  //     jobId: v4(),
  //   });
  // const { output: npcOutput, input: npcInput } = await npcWorker.enqueueJob({
  //   jobId: v4(),
  // });
  // await playerInput.feed(initialInput);

  // (async () => {
  //   for await (const data of npcOutput) {
  //     console.log("npc", data.data);
  //     await playerInput.feed(data.data);
  //   }
  // })();
  // for await (const data of playerOutput) {
  //   console.log("player", data.data);
  //   await npcInput.feed(data.data);
  // }

  console.log("done");

  // process.exit(0);
})();
// }
