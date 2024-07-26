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
  const { action, subject, target } = characterActions;
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

  const outputs = [{ action, target }]
    .map(({ action, target }) => {
      if (action === "walk_to" || action === "run_to") {
        if (target) {
          console.log("target", target);
          return {
            subject,
            type: "location",
            fromLocation: subjectProp.position || "north",
            toLocation: target,
          };
        } else {
          return {
            subject,
            type: "location",
            fromLocation: subjectProp.position || "north",
            toLocation: _.sample(["north", "west", "east", "south"]),
          };
        }

        // throw new Error(
        //   "Destination not set while the action type is " + action
        // );
      } else if (
        action === "examine" ||
        action === "punch" ||
        action === "kick" ||
        action === "operate"
      ) {
        return {
          subject: target || "unknown_target",
          type: "status",
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
