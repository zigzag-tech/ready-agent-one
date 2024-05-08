import { DefGraph, InstantiatedGraph, ZZEnv } from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { workflow } from "./workflow.conversation";

ZZEnv.setGlobal(
  ZZEnv.create({
    projectId: GAME_SPEC_NAME + "-workflow-test",
  })
);

// if (module === require.main) {
(async () => {
  // await characterSpec.startWorker();
  // await npcWorker.startWorker();
  await workflow.startWorker();
  // feed input to the playerWorker, playerWorker's output as input to npcWorker

  const { input, output, graph } = await workflow.enqueueJob({});
  saveToJSON(graph);
  await input("summary-supervision").feed(alienCaveInitialInput);
  (async () => {
    for await (const data of output("character-talk")) {
      // console.log("player:", data.data);
    }
  })();

  for await (const data of output("user-signal")) {
    console.log("user-signal:", data.data);

    if (data.data === "ENABLE") {
      // const rl = readline.createInterface({ input: stdin, output: stdout });
      // const answer = await rl.question("What you want to say?: ");
      const answer = "";
      // rl.close();

      await input("user-provided-input").feed(answer);
    }
  }

  console.log("done");

  // process.exit(0);
})();
// }

import fs from "fs";
import { alienCaveInitialInput } from "../common/alien-cave";
export function saveToJSON(g: InstantiatedGraph) {
  fs.writeFileSync(
    "workflow-converatio.graph.json",
    JSON.stringify(g.toJSON(), null, 2)
  );
}
