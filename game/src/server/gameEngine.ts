import { z } from "zod";
import { characterOutputSchema } from "./genPromptUtils";
import { actionSchema, changeSchema, gameStateSchema } from "../common/gameStateSchema";
import _ from "lodash";
export const genStateChangesByActions = (
  characterActions: z.infer<typeof characterOutputSchema>,
  currentState: z.infer<typeof gameStateSchema>
) => {
  const { actions, subject } = characterActions;
  const subjectProp = currentState.current.props.find(p => p.name === subject);
  if(!subjectProp) {
    throw new Error("Subject of name " + subject + " not found in props. ");
  }
  // const outputs = [] as z.infer<typeof changeSchema>[];
  
  const outputs :z.infer<typeof changeSchema>[]= actions.map(({ destination, action_type, target }) => {
    
    if (action_type === "walk_to" || action_type === "run_to") {
      if(!destination) {
         throw new Error("Destination not set while the action type is " + action_type);
      }

      return {
        subject,
        fromLocation: {
          ...subjectProp.position
        },
        toLocation: {...destination },
      };
      
    } else if (
      action_type === "examine" ||
      action_type === "punch" ||
      action_type === "kick" ||
      action_type === "operate"
    ) {
      return {
        subject: target || "unknown_target",
        fromState: "idle",
        toState: _.sample(["beeping", "silent", "on", "exploding", "flashing"]),
      };
    } else {
      throw new Error("Do not know how to handle action_type " + action_type);
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
