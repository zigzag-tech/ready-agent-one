import { z } from "zod";
import { Workflow, conn, expose } from "@livestack/core";
import { summarySpec } from "./summarySpec";
import { characterSpec } from "./playerWorker";
import { supervisorSpec } from "./supervisorSpec";
import { turnControl, turnControlSpec } from "./turnSpecAndWorker";

export const CONVO_MODEL = "dolphin-mistral";
export const stringZ = z.string();

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  connections: [
    conn({
      from: characterSpec,
      to: {
        spec: summarySpec,
        input: "character",
      },
    }),
    conn({
      from: summarySpec,
      to: turnControlSpec,
    }),
    conn({
      from: turnControlSpec,
      to: characterSpec,
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
      spec: characterSpec,
      input: {
        default: "character-input",
      },
      output: {
        default: "character-talk",
      },
    }),
    expose({
      spec: summarySpec,
      input: {
        supervision: "summary-supervision",
      },
    }),
  ],
});
