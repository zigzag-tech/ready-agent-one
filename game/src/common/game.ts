import { z } from "zod";

type GameEvent =
  | {
      eventType: "player-move";
      fromX: number;
      fromY: number;
      x: number;
      y: number;
    }
  | {
      eventType: "player-attack";
    }
  | {
      eventType: "player-hurt";
    }
  | {
      eventType: "minion-dies";
    }
  | {
      eventType: "boss-dies";
    };

// convert the above to zod type
export const GameEventZ = z.union([
  z.object({
    eventType: z.literal("player-move"),
    fromX: z.number(),
    fromY: z.number(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    eventType: z.union([
      z.literal("player-attack"),
      z.literal("player-hurt"),
      z.literal("minion-dies"),
      z.literal("boss-dies"),
    ]),
  }),
  z.object({
    eventType: z.literal("player-health"),
    health: z.number(),
    prevHealth: z.number(),
  }),
]);

export const EventResponseZ = z.object({
  response: z.string(),
});
export const GAME_SPEC_NAME = "live-game-one";
