export const playerPosition = {
  x: 0,
  y: 0,
  previousX: 0,
  previousY: 0,
  targetX: 0,
  targetY: 0,
  angle: 0,
};
export type EntityType = "robot" | "alien";
export interface NPCConfig {
  position:{
    x: number;
    y: number;
    previousX: number;
    previousY: number;
    targetX: number;
    targetY: number;
    angle: number;
  };
  type: EntityType;
  initialMessage: string;
  FOLLOW_SPEED: number;
  MINIMAL_DISTANCE: number;
}
export const npcConfigs: NPCConfig[] = [
  {
    position:{
      x: 10,
      y: 10,
      previousX: 0,
      previousY: 0,
      targetX: 0,
      targetY: 0,
      angle: 0,
    },
    type: "robot",
    initialMessage: "jeremy",
    FOLLOW_SPEED: 0.05,
    MINIMAL_DISTANCE: 3,
  },
  {
    position:{
      x: -10,
      y: -10,
      previousX: 0,
      previousY: 0,
      targetX: 0,
      targetY: 0,
      angle: 0,
    },
    type: "alien",
    initialMessage: "guy",
    FOLLOW_SPEED: 0.05,
    MINIMAL_DISTANCE: 6,
  },
];
export interface GameEntityProps {
  type: "robot" | "alien"; // Specify that type can be either 'robot' or 'alien'
  localPlayerState: {
    moving: boolean;
    rolling: boolean;
  };
}

export const cameraPosition = {
  previousX: 0,
  previousY: 0,
};
