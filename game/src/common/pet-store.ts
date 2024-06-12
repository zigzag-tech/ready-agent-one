import { GameState } from "./gameStateSchema";
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
  // position: `${index + 1} meters ahead`,
  position: {
    x: index * 3 - 1,
    y: index * 3 - 1,
  },
}));

const porps = [
  ...petStoreCharacterProps,
  {
    type: "object",
    name: "cat trees",
    description: "A 3-level cat tree on diplay",
    // position: "north",
    position: {
      x: 0,
      y: 10,
    },
  },
  {
    type: "object",
    name: "dog food aisle",
    description: "An aisle filled with various brands of dog food",
    position: {
      x: 5,
      y: 3,
    },
  },
  {
    type: "object",
    name: "fish tanks",
    description: "A row of aquariums with different kinds of fish",
    position: {
      x: -2,
      y: 5,
    },
  },
  {
    type: "object",
    name: "bird cages",
    description: "Cages with various colorful birds inside",
    position: {
      x: 3,
      y: -1,
    },
  },
  {
    type: "object",
    name: "cash register",
    description: "The checkout counter with a cash register",
    position: {
      x: -1,
      y: -5,
    },
  },
  {
    type: "object",
    name: "pet toys",
    description: "A display of assorted pet toys",
    position: {
      x: 2,
      y: 2,
    },
  },
  {
    type: "object",
    name: "grooming station",
    description: "A section for pet grooming services",
    position: {
      x: 6,
      y: -3,
    },
  },
  {
    type: "object",
    name: "reptile terrariums",
    description: "Enclosures for reptiles like snakes and lizards",
    position: {
      x: -4,
      y: 4,
    },
  },
  {
    type: "object",
    name: "pet accessories",
    description: "Shelves with pet collars, leashes, and clothes",
    position: {
      x: -3,
      y: 3,
    },
  },
  {
    type: "object",
    name: "aquarium supplies",
    description: "A section with filters, decorations, and fish food",
    position: {
      x: 4,
      y: 4,
    },
  },
  {
    type: "object",
    name: "rabbit hutches",
    description: "Cages and hutches for rabbits",
    position: {
      x: 1,
      y: 6,
    },
  },
  {
    type: "object",
    name: "dog bowls",
    description: "A variety of dog bowls and feeders",
    position: {
      x: 6,
      y: 1,
    },
  },
  {
    type: "object",
    name: "dog training books",
    description: "A shelf filled with books and manuals on dog training",
    position: {
      x: -1,
      y: 4,
    },
  },
  {
    type: "object",
    name: "dog vitamins and supplements",
    description: "A section with vitamins and supplements for dogs",
    position: {
      x: 2,
      y: -2,
    },
  },
  {
    type: "object",
    name: "dog beds",
    description: "A variety of comfortable dog beds",
    position: {
      x: 3,
      y: 7,
    },
  },
  {
    type: "object",
    name: "dog bathing station",
    description: "A station equipped for bathing dogs",
    position: {
      x: -4,
      y: -3,
    },
  },
  {
    type: "object",
    name: "dog food samples",
    description: "A table with free samples of various dog foods",
    position: {
      x: 3,
      y: -5,
    },
  },
  {
    type: "object",
    name: "puppy playpen",
    description: "An area for puppies to play and socialize",
    position: {
      x: 0,
      y: 3,
    },
  },
  {
    type: "object",
    name: "dog adoption posters",
    description: "Posters and flyers about dogs available for adoption",
    position: {
      x: 1,
      y: -4,
    },
  },
  {
    type: "object",
    name: "dog training clickers",
    description: "A rack with various dog training clickers",
    position: {
      x: -5,
      y: 5,
    },
  },
  {
    type: "object",
    name: "dog beds",
    description: "A variety of comfortable dog beds",
    position: {
      x: 3,
      y: 7,
    },
  },
  {
    type: "object",
    name: "dog grooming supplies",
    description: "Shampoos, brushes, and other grooming items for dogs",
    position: {
      x: 7,
      y: 2,
    },
  },
  {
    type: "object",
    name: "dog training area",
    description: "An area with agility equipment for dog training",
    position: {
      x: 8,
      y: -2,
    },
  },
  {
    type: "object",
    name: "dog crates",
    description: "Different sizes of dog crates and kennels",
    position: {
      x: -2,
      y: -6,
    },
  },
  {
    type: "object",
    name: "dog treats",
    description: "Shelves stocked with a variety of dog treats",
    position: {
      x: 4,
      y: -3,
    },
  },
  {
    type: "object",
    name: "dog leashes and collars",
    description: "A display with different styles of leashes and collars",
    position: {
      x: -5,
      y: 2,
    },
  },
  {
    type: "object",
    name: "dog clothing",
    description: "A section with clothes and costumes for dogs",
    position: {
      x: 5,
      y: -4,
    },
  },
  {
    type: "object",
    name: "dog carriers",
    description: "Portable dog carriers for travel",
    position: {
      x: -3,
      y: 1,
    },
  },
];
export const petStoreInitialInput: GameState & { releaseChange: boolean } = {
  current: {
    summary:
      "The story begins in a pet store called 'Pet Paradise'. The store is bustling with customers and pets. Morgan, a recent dog owner, is looking for tips and tricks to train her dog. She approaches Guy.",
    props: porps,
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
