import { LiveEnv, sleep } from "@livestack/core";
import { InstantiatedGraph } from "@livestack/shared";
import { GAME_SPEC_NAME } from "../common/game";
import { liveflow } from "./liveflow.conversation";
import inquire from "inquirer";

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
      const characterOutput = data.data as CharacterOutput;
      // format: character: [action target] message

      console.log(
        `${characterOutput.subject}: [${characterOutput.action} ${characterOutput.target}] ${characterOutput.message}`
      );
    }
  })();

  (async () => {
    for await (const data of output("new-scene-and-goal-raw")) {
      const newSceneOutput = data.data as string;
      console.log(newSceneOutput);
    }
  })();

  (async () => {
    for await (const data of output("needs-user-signal")) {
      await input("user-signal").feed("next");
    }
  })();

  for await (const data of output("needs-user-choice")) {
    const { choices: choiceObjs, criteria } = data.data;
    const answer = await inquire.prompt([
      {
        type: "list",
        name: "userChoice",
        message: `Goal: ${criteria[0]?.goalDescription}\n Please choose an option:`,
        choices: choiceObjs.map((option) => option.label),
      } as any,
    ]);
    // console.log(answer);
    await input("user-choice").feed(answer.userChoice);
  }

  console.log("done");

  // process.exit(0);
})();
// }

import fs from "fs";
import { alienCaveInitialInput } from "../common/alien-cave";
import { petStoreInitialInput } from "../common/pet-store";
import { CharacterOutput } from "../common/characterOutputSchema";
export function saveToJSON(g: InstantiatedGraph) {
  fs.writeFileSync(
    "workflow-converatio.graph.json",
    JSON.stringify(g.toJSON(), null, 2)
  );
}
