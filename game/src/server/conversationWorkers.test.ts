import pkg from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { npcWorker, playerWorker } from "./conversationWorkers";
import { v4 } from "uuid";
const { ZZEnv, JobSpec } = pkg;

ZZEnv.setGlobal(
  new ZZEnv({
    projectId: GAME_SPEC_NAME + new Date().getTime(),
  })
);

if (module === require.main) {
  (async () => {
    await playerWorker.startWorker();
    await npcWorker.startWorker();
    // feed input to the playerWorker, playerWorker's output as input to npcWorker
    const initialInput = "Hello player, welcome to the Mob-attack game!";
    const { output: playerOutput, input: playerInput } =
      await playerWorker.enqueueJob({
        jobId: v4(),
      });
    const { output: npcOutput, input: npcInput } = await npcWorker.enqueueJob({
      jobId: v4(),
    });
    await playerInput.feed(initialInput);

    (async () => {
      for await (const data of npcOutput) {
        console.log(data.data);
        await playerInput.feed(data.data);
      }
    })();
    for await (const data of playerOutput) {
      console.log(data.data);
      await npcInput.feed(data.data);
    }

    console.log("done");

    process.exit(0);
  })();
}
