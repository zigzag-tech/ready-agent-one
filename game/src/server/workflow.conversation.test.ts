import { ZZEnv } from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { workflow } from "./workflow.conversation";
import { GameState } from "./summarySpec";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

ZZEnv.setGlobal(
  new ZZEnv({
    projectId: GAME_SPEC_NAME + new Date().getTime(),
  })
);

// if (module === require.main) {
(async () => {
  // await characterSpec.startWorker();
  // await npcWorker.startWorker();
  await workflow.startWorker();
  // feed input to the playerWorker, playerWorker's output as input to npcWorker
  const initialInput: GameState = {
    previous: {
      summary: "",
    },
    current: {
      summary:
        "It is year 2300. In the outer space, two astronauts are about to run out of oxygen. They are trying to fix the oxygen tank.",
    },
    sceneNumber: 1,
    recentHistory: [
      {
        speaker: "jeremy",
        message: "What the hell is going on with the oxygen indicator?",
      },
    ],
    totalNumOfLines: 1,
  };

  const { input, output } = await workflow.enqueueJob({});
  await input("summary-supervision").feed(initialInput);
  (async ()=>{for await (const data of output("character-talk")) {
    // console.log("player:", data.data);
  }})()

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
