import { ZZEnv } from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { workflow } from "./workflow.conversation";
import { GameState } from "./summarySpec";

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
    recentHistory: ["NPC: Mother of god."],
    totalNumOfLines: 1,
  };

  const { input, output } = await workflow.enqueueJob({});
  await input("summary-supervision").feed(initialInput);
  for await (const data of output("character-talk")) {
    // console.log("player:", data.data);
  }

  console.log("done");

  // process.exit(0);
})();
// }
