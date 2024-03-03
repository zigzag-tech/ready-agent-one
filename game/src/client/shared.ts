import { World, Vec2, Body } from "planck";

export const planckWorld = World({
  allowSleep: true,
  gravity: Vec2(0, 0),
});

export let unsyncedBodies = false;
export let bodiesLastUpdated = 0;

export const updateBodiesLastUpdated = () => {
  bodiesLastUpdated = Date.now();
  unsyncedBodies = true;
};

export const setBodiesSynced = () => {
  unsyncedBodies = false;
};

export const dynamicBodiesUuids: string[] = [];

export const existingBodies = new Map<string, Body>();
