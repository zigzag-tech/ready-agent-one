import { z } from "zod";
import { Workflow, conn, expose } from "@livestack/core";
import { summarySpec } from "./summarySpec";
import { characterSpec } from "./characterWorker";
import { supervisorSpec } from "./supervisorSpec";
import { turnControlSpec } from "./turnSpecAndWorker";


export const stringZ = z.string();

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  connections: [
    conn({
      from: { spec: characterSpec, output: "default" },
      to: {
        spec: summarySpec,
        input: "character",
      },
    }),
    conn({
      from: supervisorSpec,
      to: turnControlSpec,
    }),
    conn({
      from: turnControlSpec,
      to: { spec: characterSpec, input: "default" },
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
    expose(characterSpec.input.default, "character-input"),
    expose(characterSpec.input["user-input"], "user-provided-input"),
    expose(characterSpec.output.default, "character-talk"),
    expose(characterSpec.output["user-signal"], "user-signal"),
    expose(summarySpec.input.supervision, "summary-supervision"),
    expose(summarySpec.output["default"], "game-state"),
  ],
});
