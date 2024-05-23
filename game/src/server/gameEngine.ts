import { z } from "zod";
import {
  actionSchema,
  stateEventSchema,
  gameStateSchema,
} from "../common/gameStateSchema";
import _ from "lodash";
import { characterOutputSchema } from "../common/characterOutputSchema";
export const genStateChangesByActions = (
  characterActions: z.infer<typeof characterOutputSchema>,
  currentState: z.infer<typeof gameStateSchema>
) => {
  const { actions, subject } = characterActions;
  const subjectProp = currentState.current.props.find(
    (p) => p.name === subject
  );
  if (!subjectProp) {
    console.error(
      "Props: ",
      currentState.current.props.map((p) => p.name)
    );
    throw new Error("Subject of name " + subject + " not found in props. ");
  }
  // const outputs = [] as z.infer<typeof changeSchema>[];

  const outputs = actions
    .map(({ destination, action, target }) => {
      if (action === "walk_to" || action === "run_to") {
        if (destination) {
          return {
            subject,
            fromLocation: {
              ...(subjectProp.position || { x: 0, y: 0 }),
            },
            toLocation: { ...destination },
          };
        } else if (target) {
          const targetProp = currentState.current.props.find(
            (p) => p.name === target
          );
          if (targetProp) {
            return {
              subject,
              fromLocation: {
                ...(subjectProp.position || { x: 0, y: 0 }),
              },
              toLocation: {
                ...(targetProp.position || { x: 0, y: 0 }),
              },
            };
          }
          throw new Error(
            "Target not found while the action type is " + action
          );
        }

        throw new Error(
          "Destination not set while the action type is " + action
        );

        
      } else if (
        action === "examine" ||
        action === "punch" ||
        action === "kick" ||
        action === "operate"
      ) {
        return {
          subject: target || "unknown_target",
          fromState: "idle",
          toState: _.sample([
            "beeping",
            "silent",
            "on",
            "exploding",
            "flashing",
          ]),
        };
      } else {
        return null;
      }
    })
    .filter((o) => !!o) as z.infer<typeof stateEventSchema>[];
  return outputs;
};

// [
//     {"action": "talk", "message": "[sample_message]"},
//     {"action": "walk_to", "target": "[sample_destination]"},
//     {"action": "jump", "target": null },
//     {"action": "examine", "target": "[sample_target]" },
//     {"action": "operate", "target": "[sample_target]" },
//     {"action": "punch", "target": "[sample_target]" },
//     {"action": "kick", "target": "[sample_target]" },
//     {"action": "run_to", "target": "[sample_destination]" }
//   ]
