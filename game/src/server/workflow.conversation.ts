import { z } from "zod";
import { Workflow, conn, expose } from "@livestack/core";
import { summarySpec } from "./summarySpec";
import { characterSpec } from "./characterWorker";
import { supervisorSpec } from "./supervisorSpec";
import { turnControlSpec } from "./turnSpecAndWorker";
import { gameEngineSpec } from "./gameEngineSpec";

export const stringZ = z.string();

export const workflow = Workflow.define({
  name: "CONVERSATION_WORKFLOW",
  connections: [
    conn({
      from: characterSpec,
      to: gameEngineSpec.input["character"],
    }),
    conn({
      from: supervisorSpec,
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
      to: gameEngineSpec.input["supervision"],
    }),
    conn({
      from: gameEngineSpec,
      to: summarySpec,
    }),
  ],
  exposures: [
    expose(characterSpec.input.default, "character-input"),
    expose(characterSpec.input["user-input"], "user-provided-input"),
    expose(characterSpec.output.default, "character-talk"),
    expose(characterSpec.output["user-signal"], "user-signal"),
    expose(summarySpec.input.default, "summary-supervision"),
    expose(summarySpec.output["default"], "game-state"),
    expose(gameEngineSpec.output["history-entries"], "history-entries"),
  ],
});
