import { LiveEnv, sleep } from "@livestack/core";
import { InstantiatedGraph } from "@livestack/shared";
import { GAME_SPEC_NAME } from "../common/game";
import { liveflow } from "./liveflow.conversation";
import inquire from 'inquirer';

LiveEnv.setGlobal(
  LiveEnv.create({
    projectId: GAME_SPEC_NAME + "-workflow-test",
  })
);

// if (module === require.main) {
(async () => {
  // await characterSpec.startWorker();
  // await npcWorker.startWorker();
  await liveflow.startWorker();
  // feed input to the playerWorker, playerWorker's output as input to npcWorker

  const { input, output, graph } = await liveflow.enqueueJob({});
  saveToJSON(graph);
  await input("summary-supervision").feed(petStoreInitialInput);
  (async () => {
    for await (const data of output("character-talk")) {
      // console.log("player:", data.data);
    }
  })();

  for await (const data of output("needs-user-choice")) {
    const options = data.data;
    const answer = await inquire.prompt([
      {
        type: 'list',
        name: 'userChoice',
        message: 'Please choose an option:',
        choices: options.map(option => option.label),
      }
    ]);
    console.log(answer);
    await input("user-choice").feed(answer.userChoice);
  }

  console.log("done");

  // process.exit(0);
})();
// }

import fs from "fs";
import { alienCaveInitialInput } from "../common/alien-cave";
import { petStoreInitialInput } from "../common/pet-store";
export function saveToJSON(g: InstantiatedGraph) {
  fs.writeFileSync(
    "workflow-converatio.graph.json",
    JSON.stringify(g.toJSON(), null, 2)
  );
}
