import { z } from "zod";
import { characterOutputSchema } from "./genPromptUtils";
import { actionSchema, changeSchema } from "../common/gameStateSchema";

export const genStateChangesByActions = (
  characterActions: z.infer<typeof characterOutputSchema>
) => {
  const { actions, subject } = characterActions;
  const outputs = [] as z.infer<typeof changeSchema>[];
  actions.forEach(({ action_type, target }) => {
    if (action_type === "walk_to" || action_type === "run_to") {
      outputs.push({
        subject,
        fromLocation: { x: 0, y: 0 },
        toLocation: { x: 1, y: 1 },
      });
    } else if (
      action_type === "examine" ||
      action_type === "operate" ||
      action_type === "punch" ||
      action_type === "kick"
    ) {
      outputs.push({
        subject: target || "unknown_target",
        fromState: "idle",
        toState: "occupied",
      });
    }
  });
  return outputs;
};

// [
//     {"action_type": "talk", "message": "[sample_message]"},
//     {"action_type": "walk_to", "target": "[sample_destination]"},
//     {"action_type": "jump", "target": null },
//     {"action_type": "examine", "target": "[sample_target]" },
//     {"action_type": "operate", "target": "[sample_target]" },
//     {"action_type": "punch", "target": "[sample_target]" },
//     {"action_type": "kick", "target": "[sample_target]" },
//     {"action_type": "run_to", "target": "[sample_destination]" }
//   ]
