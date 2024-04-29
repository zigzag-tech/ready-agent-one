import { DefGraph, InstantiatedGraph, ZZEnv } from "@livestack/core";
import { GAME_SPEC_NAME } from "../common/game";
import { workflow } from "./workflow.conversation";
import { GameState } from "./summarySpec";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { DIRECTIVE_BY_ROLE } from "./genPromptUtils";

const vicinity = [
  ...Object.keys(DIRECTIVE_BY_ROLE).map((role, index) => ({
    type: "person",
    name: role,
    description: DIRECTIVE_BY_ROLE[role],
    position: `${index + 1} meters ahead`,
  })),
  {
    type: "object",
    name: "cave",
    description: "A mysterious cave",
    position: "north",
  },
  {
    type: "object",
    name: "small rock",
    description: "A small rock",
    position: "east",
  },
  {
    type: "object",
    name: "giant tree",
    description: "An alien looking tree that is 10 meters tall",
    position: "south",
  },
  {
    type: "object",
    name: "lifeform detector",
    description: "A device that can detect lifeforms.",
    position: "west",
  },
];

ZZEnv.setGlobal(
  ZZEnv.create({
    projectId: GAME_SPEC_NAME,
  })
);

// if (module === require.main) {
(async () => {
  // await characterSpec.startWorker();
  // await npcWorker.startWorker();
  await workflow.startWorker();
  // feed input to the playerWorker, playerWorker's output as input to npcWorker
  const initialInput: GameState = {
    current: {
      summary:
        "It is year 2300. In an alien planet, a group of astronauts went into a jungle and found a mysterious cave.",
      props: vicinity,
    },
    sceneNumber: 1,
    recentHistory: [
      {
        subject: "guy",
        intent: "Guy is looking for a place to take a selfie.",
        reflection: "Guy is looking for a place to take a selfie.",
        actions: [
          {
            action_type: "talk",
            message: "Hey, Morgan, do you see that cave?",
          },
        ],
        stateChanges: [],
      },
    ],
    totalNumOfLines: 1,
  };

  const { input, output, graph } = await workflow.enqueueJob({});
  saveToJSON(graph);
  await input("summary-supervision").feed(initialInput);
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
export function saveToJSON(g: InstantiatedGraph) {
  fs.writeFileSync(
    "workflow-converatio.graph.json",
    JSON.stringify(g.toJSON(), null, 2)
  );
}
