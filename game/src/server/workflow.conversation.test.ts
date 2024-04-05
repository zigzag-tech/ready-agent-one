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
    name: "wrench",
    description: "A rusty wrench.",
    position: "10 meters north",
  },
  {
    type: "object",
    name: "control panel",
    description: "A control panel.",
    position: "3 meters ahead",
  },
  {
    type: "object",
    name: "red button",
    description: "A red button that says 'LAUNCH'",
    position: "control panel",
  },
  {
    type: "object",
    name: "green button",
    description: "A green button that says 'RELAX MAN'",
    position: "control panel",
  },
  {
    type: "object",
    name: "yellow button",
    description: "A yellow button that says 'BANANAS'",
    position: "control panel",
  },
  {
    type: "object",
    name: "duct tape",
    description: "roll of duct tape.",
    position: "on the floor",
  },
  {
    type: "object",
    name: "exit sign",
    description: "A sign that says 'EXIT' with an arrow pointing to the right.",
    position: "5 meters south",
  },
  {
    type: "object",
    name: "oxygen tank",
    description: "A large oxygen tank.",
    position: "7 meters ahead",
  },
];

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
    current: {
      summary:
        "It is year 2300. In the outer space, three astronauts are about to run out of oxygen. They are trying to fix the oxygen tank.",
      props: vicinity,
    },
    sceneNumber: 1,
    recentHistory: [
      {
        speaker: "guy",
        message: "What the hell is going on with the oxygen indicator?",
        actions: [],
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
