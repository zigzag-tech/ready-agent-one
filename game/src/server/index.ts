import pkg from "@livestack/core";
import express from "express";
import ViteExpress from "vite-express";
import gatewayPkg from "@livestack/gateway";
import ollama from "ollama";
import { EventResponseZ, GAME_SPEC_NAME, GameEventZ } from "../common/game";
import { npcWorker, playerWorker, workflow } from "./conversationWorkers";

import { fakePoemWorker } from "./fakePoemWorker";
const { ZZEnv, JobSpec } = pkg;
const { initJobBinding } = gatewayPkg;
const app = express();

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

ZZEnv.setGlobal(
  new ZZEnv({
    projectId: GAME_SPEC_NAME + new Date().getTime(),
  })
);

const gameSpec = JobSpec.define({
  name: GAME_SPEC_NAME,
  input: GameEventZ,
  output: EventResponseZ,
});

const getRandomPhraseByEventType = (eventType: string) => {
  const attackPhrases = [
    "Charge!",
    "Let's go, team, unleash hell!",
    "Rush 'em!",
    "All guns blazing!",
    "Fire at will!",
    "Launch the assault!",
    "Dive in!",
    "Blitz them!",
    "Push forward!",
    "Leroy Jenkins!",
  ];

  const minionDeathPhrases = [
    "Target eliminated!",
    "Enemy down!",
    "That's one less to worry about!",
    "Hostile neutralized!",
    "They won't be causing any more trouble!",
    "Enemy dispatched!",
    "Got 'em!",
    "Another one bites the dust!",
    "Hostile eradicated!",
    "Down and out!",
  ];
  const phrases =
    eventType === "player-attack" ? attackPhrases : minionDeathPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const gameWorker = gameSpec.defineWorker({
  processor: async ({ input, output }) => {
    for await (const data of input) {
      switch (data.eventType) {
        case "player-move":
          const { x, y } = data;
          const movement =
            x < 0 ? "left" : x > 0 ? "right" : y < 0 ? "down" : "up";
          output.emit({
            response: `I just moved ${movement}`,
          });
          break;
        case "player-attack": {
          const response = await ollama.chat({
            model: "mistral",
            messages: [
              {
                role: "user",
                content: getRandomPhraseByEventType(data.eventType),
              },
            ],
          });

          output.emit({
            response: response.message.content,
          });
          break;
        }
        case "player-hurt":
          output.emit({
            response: "Ouch! That hurt!",
          });
          break;
        case "minion-dies":
          output.emit({
            response: getRandomPhraseByEventType(data.eventType),
          });
          break;
        case "boss-dies":
          output.emit({
            response: "YAY I won!",
          });
          break;

        case "player-health": {
          const response = await healthTemp(data);
          output.emit({
            response,
          });
          break;
        }
      }
    }
  },
});

async function healthTemp({
  health,
  prevHealth,
}: {
  health: number;
  prevHealth: number;
}) {
  const prompt = `
  You are a commentator for a real time game. Your job is to write one-line humorous quib about the current situation, given some state about the game.

  CURRENT STATE:
  {
    playerName: "horn",
    playerHealth: ${health} / 4, (0: dead, 4: full health)
    previousHealth: ${prevHealth}
  }

  Write a one line quib about the current situation with no more than 7 words.

  ONE LINE:
  `;
  const response = await ollama.chat({
    options: {
      temperature: 0.5,
    },
    model: "mistral",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.message.content;
}

// gameWorker.startWorker();
// fakePoemWorker.startWorker();
// fakePoemWorker.startWorker();
// workflow.startWorker();
// playerWorker.startWorker();
// npcWorker.startWorker();

const PORT = 3520;
const server = ViteExpress.listen(app, PORT, () =>
  console.log(`Hello World server listening on http://localhost:${PORT}.`)
);

initJobBinding({
  httpServer: server,
  allowedSpecsForBinding: [gameSpec, workflow],
});

