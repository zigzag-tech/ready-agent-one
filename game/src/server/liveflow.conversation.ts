import { z } from "zod";
import { Liveflow, conn, expose } from "@livestack/core";
import { summarySpec } from "./summarySpec";
import { characterSpec } from "./characterWorker";
import { supervisorSpec } from "./supervisorSpec";
import { turnControlSpec } from "./turnSpecAndWorker";
import { gameEngineSpec } from "./gameEngineSpec";

// whenever scene increments, we need new scene and props (supervisor resets the scene)
// whenever character has new actions (talk or movements), we need new actions/speech
// whenever game engine updates the props states, we need new props states (triggered by character actions)

export const stringZ = z.string();

export const liveflow = Liveflow.define({
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
    expose(gameEngineSpec.input.supervision, "summary-supervision"),
    expose(supervisorSpec.output["default"], "game-state"),
    expose(gameEngineSpec.output["history-entries"], "history-entries"),
  ],
});
