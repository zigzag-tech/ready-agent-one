import { GameState, locationSchema } from "./gameStateSchema";
import { z } from "zod";
export const PET_STORE_DIRECTIVE_BY_ROLE = {
  morgan:
    "Morgan is a recent dog owner and is looking for tips and tricks to train her dog.",
  guy: "Guy is store clerk very clumsy and often messes things up. ",
  jackie:
    "Jackie is the store manager and is looking for ways to improve the store.",
};

export const petStoreCharacterProps = Object.entries(
  PET_STORE_DIRECTIVE_BY_ROLE
).map(([role, description], index) => ({
  type: "person",
  name: role,
  description: description,
  position: `southeast` as z.infer<typeof locationSchema>,
  // position: {
  //   x: index * 3 - 1,
  //   y: index * 3 - 1,
  // },
}));

const props = [
  ...petStoreCharacterProps,
  {
    type: "object",
    name: "cat trees",
    description: "A 3-level cat tree on diplay",
    position: "north" as z.infer<typeof locationSchema>,
    // position: {
    //   x: 0,
    //   y: 10,
    // },
  },
  {
    type: "object",
    name: "dog food aisle",
    description: "An aisle filled with various brands of dog food",
    position: "south" as z.infer<typeof locationSchema>,
    // position: {
    //   x: 5,
    //   y: 3,
    // },
  },
  {
    type: "object",
    name: "fish tanks",
    description: "A row of aquariums with different kinds of fish",
    position: "west" as z.infer<typeof locationSchema>,
    // position: {
    //   x: -2,
    //   y: 5,
    // },
  },
  {
    type: "object",
    name: "bird cages",
    description: "Cages with various colorful birds inside",
    position: "east" as z.infer<typeof locationSchema>,
    // position: {
    //   x: 3,
    //   y: -1,
    // },
  },
  {
    type: "object",
    name: "cash register",
    description: "The checkout counter with a cash register",
    position: "west" as z.infer<typeof locationSchema>,
    // position: {
    //   x: -1,
    //   y: -5,
    // },
  },
  {
    type: "object",
    name: "pet toys",
    description: "A display of assorted pet toys",
    position: "north" as z.infer<typeof locationSchema>,
    // position: {
    //   x: 2,
    //   y: 2,
    // },
  },
  {
    type: "object",
    name: "grooming station",
    description: "A section for pet grooming services",
    position: "south" as z.infer<typeof locationSchema>,
    // position: {
    //   x: 6,
    //   y: -3,
    // },
  },
  {
    type: "object",
    name: "reptile terrariums",
    description: "Enclosures for reptiles like snakes and lizards",
    position: "south" as z.infer<typeof locationSchema>,
    // position: {
    //   x: -4,
    //   y: 4,
    // },
  },
];
export const petStoreInitialInput: GameState & { releaseChange: boolean } = {
  current: {
    summary:
      "The story begins in a pet store called 'Pet Paradise'. The store is bustling with customers and pets. Morgan, a recent dog owner, is looking for tips and tricks to train her dog. She approaches Guy.",
    props: props,
  },
  sceneNumber: 1,
  recentHistory: [
    {
      subject: "guy",
      thinking: "Guy is kinda bored.",
      action: "yawn",
      target: null,
      message: "What a boring day... Another day at the store.",
      stateChanges: [],
    },
  ],
  totalNumOfLines: 1,
  releaseChange: true,
};
