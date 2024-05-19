import { GameState } from "../common/gameStateSchema";

export const DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is prudent, courageous but could slip into self doubt from time to time. ",
  jeremy: "Jeremy has a sarcastic streak but deep down he's kind and helpful.",
  guy: "Guy is tring to acting helpful but he always messes things up.",
};

export const characterProps = Object.entries(DIRECTIVE_BY_ROLE).map(
  ([role, description], index) => ({
    type: "person",
    name: role,
    description: description,
    // position: `${index + 1} meters ahead`,
    position: {
      x: index + 1,
      y: 0,
    },
  })
);

const porps = [
  ...characterProps,
  {
    type: "object",
    name: "cave",
    description: "A mysterious cave",
    // position: "north",
    position: {
      x: 0,
      y: 5,
    },
  },
  {
    type: "object",
    name: "small rock",
    description: "A small rock",
    // position: "east",
    position: {
      x: 5,
      y: 0,
    },
  },
  {
    type: "object",
    name: "giant tree",
    description: "An alien looking tree that is 10 meters tall",
    // position: "south",
    position: {
      x: 0,
      y: -10,
    },
  },
  {
    type: "object",
    name: "lifeform detector",
    description: "A device that can detect lifeforms.",
    // position: "west",
    position: {
      x: -5,
      y: 0,
    },
  },
];
export const alienCaveInitialInput: GameState = {
  current: {
    summary:
      "It is year 2300. In an alien planet, a group of astronauts went into a jungle and found a mysterious cave.",
    props: porps,
  },
  sceneNumber: 1,
  recentHistory: [
    {
      subject: "guy",
      // intent: "Guy is looking for a place to take a selfie.",
      reflection: "Guy is looking for a place to take a selfie.",
      actions: [
        {
          action: "talk",
          message: "Hey, Morgan, do you see that cave?",
        },
      ],
      stateChanges: [],
    },
  ],
  totalNumOfLines: 1,
};
