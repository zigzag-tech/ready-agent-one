import { GameState } from "../common/gameStateSchema";

export const DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy: "Jeremy has a sarcastic streak but is generally helpful. ",
  guy: "Guy is impatient and often messes things up. Nonetheless, he can have ingenious ideas.",
};

export const characterProps = Object.entries(DIRECTIVE_BY_ROLE).map(
  ([role, description], index) => ({
    type: "person",
    name: role,
    description: description,
    position: `southwest` as const,
    // position: {
    //   x: index * 3 - 1,
    //   y: index * 3 - 1,
    // },
  })
);

const porps = [
  ...characterProps,
  {
    type: "object",
    name: "cave",
    description: "A mysterious cave",
    position: "north" as const,
    // position: {
    //   x: 0,
    //   y: 10,
    // },
  },
  {
    type: "object",
    name: "small rock",
    description: "A small rock",
    position: "east" as const,
    // position: {
    //   x: 8,
    //   y: 0,
    // },
  },
  {
    type: "object",
    name: "giant tree",
    description: "An alien looking tree that is 10 meters tall",
    position: "south" as const,
    // position: {
    //   x: 0,
    //   y: -10,
    // },
  },
  {
    type: "object",
    name: "lifeform detector",
    description: "A device that can detect lifeforms.",
    position: "west" as const,
    // position: {
    //   x: -8,
    //   y: 0,
    // },
  },
];
export const alienCaveInitialInput: GameState & { stateHasChanged: boolean } = {
  current: {
    summary:
      "It is year 2300. In an alien planet, a group of astronauts went into a jungle and found a mysterious cave.",
    props: porps,
    criteria: [
      {
        type: "is_at",
        character: "guy",
        object: "cave",
      },
    ],
  },
  sceneNumber: 1,
  recentHistory: [
    {
      subject: "guy",
      // intent: "Guy is looking for a place to take a selfie.",
      thinking: "Guy is looking for a place to take a selfie.",
      action: "talk",
      message: "Hey, Morgan, do you see that cave?",
      stateChanges: [],
    },
  ],
  totalNumOfLines: 1,
  stateHasChanged: true,
};
