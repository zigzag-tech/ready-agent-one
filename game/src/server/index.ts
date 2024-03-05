import pkg from "@livestack/core";
import express from "express";
import ViteExpress from "vite-express";
import gatewayPkg from "@livestack/gateway";
import { EventResponseZ, GAME_SPEC_NAME, GameEventZ } from "../common/game";
import ollama from "ollama";
const { ZZEnv, JobSpec } = pkg;
const { initJobBinding } = gatewayPkg;
const app = express();

const zzEnv = new ZZEnv({
  projectId: GAME_SPEC_NAME + new Date().getTime(),
});

const gameSpec = JobSpec.define({
  zzEnv,
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
        case "player-attack":
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
      }
    }
  },
});

gameWorker.startWorker();

const PORT = 3000;
const server = ViteExpress.listen(app, PORT, () =>
  console.log(`Hello World server listening on http://localhost:${PORT}.`)
);

initJobBinding({
  zzEnv,
  httpServer: server,
  allowedSpecsForBinding: [gameSpec],
});

