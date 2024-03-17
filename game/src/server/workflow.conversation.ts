import pkg from "@livestack/core";
import { z } from "zod";
;
import { supervisorSpec } from "./supervisorSpec";
import { summarySpec } from "./summarySpec";
import { gameStateSchema } from "../common/gameStateSchema";
const { JobSpec, Workflow, conn, expose, sleep } = pkg;

export const CONVO_MODEL = "dolphin-mistral";
export const stringZ = z.string();
export const playerWorkerSpec = JobSpec.define({
  name: "PLAYER_WORKER",
  input: gameStateSchema,
  output: stringZ,
});

export const npcWorkerSpec = JobSpec.define({
  name: "NPC_WORKER",
  input: gameStateSchema,
  output: stringZ,
});

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  connections: [
    conn({
      from: playerWorkerSpec,
      to: {
        spec: summarySpec,
        input: "player",
      },
    }),
    conn({
      from: npcWorkerSpec,
      to: {
        spec: summarySpec,
        input: "npc",
      },
    }),
    conn({
      from: summarySpec,
      to: playerWorkerSpec,
    }),
    conn({
      from: summarySpec,
      to: npcWorkerSpec,
    }),
    conn({
      from: summarySpec,
      to: supervisorSpec,
    }),
    conn({
      from: supervisorSpec,
      to: {
        spec: summarySpec,
        input: "supervision",
      },
    }),
  ],
  exposures: [
    expose({
      spec: playerWorkerSpec,
      input: {
        default: "player-input",
      },
      output: {
        default: "player-talk",
      },
    }),
    expose({
      spec: npcWorkerSpec,
      input: {
        default: "npc-input",
      },
      output: {
        default: "npc-talk",
      },
    }),
  ],
});


