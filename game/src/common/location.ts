import { z } from "zod";
import { objectLocationChangeSchema, locationSchema } from "./gameStateSchema";

type Position = z.infer<typeof locationSchema>;

interface Coordinates {
  x: number;
  y: number;
}

const scaleFactor = 5;

function randomlyOffsetCoordinates(
  base: Coordinates,
  range: number
): Coordinates {
  const { x: baseX, y: baseY } = base;
  const offsetX = (Math.random() - 0.5) * range * 2;
  const offsetY = (Math.random() - 0.5) * range * 2;
  return {
    x: (baseX + offsetX) * scaleFactor,
    y: (baseY + offsetY) * scaleFactor,
  };
}

const baseCoordinates: { [key in Position]: Coordinates } = {
  center: { x: 0, y: 0 },
  north: { x: 0, y: 1 },
  south: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
  northeast: { x: 1, y: 1 },
  northwest: { x: -1, y: 1 },
  southeast: { x: 1, y: -1 },
  southwest: { x: -1, y: -1 },
};

export function convertToRandomCoordinates(position: Position): Coordinates {
  const base = baseCoordinates[position];
  return randomlyOffsetCoordinates(base, 0.1); // Adjust the range as needed
}

export function addCoordinatesToObjectLocation(
  input: z.infer<typeof objectLocationChangeSchema>
): z.infer<typeof objectLocationChangeSchema> & {
  fromCoordinates: Coordinates;
  toCoordinates: Coordinates;
} {
  const fromCoordinates = convertToRandomCoordinates(input.fromLocation);
  const toCoordinates = convertToRandomCoordinates(input.toLocation);

  return {
    ...input,
    fromCoordinates,
    toCoordinates,
  };
}
