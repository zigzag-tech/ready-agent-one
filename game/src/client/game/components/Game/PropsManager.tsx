import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { LiveJobContext } from "./LiveJob";
import * as THREE from "three";
import { useOutput } from "@livestack/client/src";
import { gameStateSchema } from "../../../../common/gameStateSchema";
import { z } from "zod";
import Robot from "../../../3d/models/Knight/Robot";
import Alien from "../../../3d/models/Knight/Alien";
import Knight from "../../../3d/models/Knight/Knight";
import { useSnapshot } from "valtio";
import { npcPlayerVisual } from "../../../3d/models/Knight/NPC";
import { useFrame } from "@react-three/fiber";
interface localPlayerState {
  moving: boolean;
  rolling: boolean;
}
function PropRenderer({
  prop,
}: {
  prop: {
    name: string;
    type: string;
    description: string;
    position: string;
    moving: boolean,
    rolling: boolean,
    current_position: {
      x: number;
      y: number;
      previousX: number;
      previousY: number;
      targetX: number;
      targetY: number;
      angle: number;
    };
  };
}) {
  const pos = useMemo(
    () =>
      new THREE.Vector3(
        prop.current_position.x,
        0,
        prop.current_position.y
      ).multiplyScalar(MAGNITUDE),
    [prop]
  );
  const CharacterComponent = useMemo(() => {
    // Randomly returns either <Robot /> or <Alien />
    const types = [Robot, Alien, Knight];
    return types[Math.floor(Math.random() * types.length)];
  }, []);
  const npcRef = useRef(null);
  if (prop.type == 'person') {
    return (
      <group scale={1} position={pos} key={prop.name}>
        <CharacterComponent
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={prop.moving}
          recharging={false}
          running={prop.rolling}
        />
      </group>

    );
  }

}
export const currentPlayerState = {
  moving: false,
  rolling: false,
}
export function PropsManager() {
  const job = React.useContext(LiveJobContext).conersationJob;
  if (!job) {
    return <>Error: cannot connect to the game server</>;
  }
  // const gameState = useOutput({
  //   tag: "game-state",
  //   def: gameStateSchema,
  //   job,
  // });

  // mock gameState
  const [gameState, setGameState] = useState<z.infer<typeof gameStateSchema>>({
    current: {
      summary: "a cat and a dog are in the room",
      props: [
        {
          name: "cat",
          type: "person",
          description: "a cat",
          position: "east",
          moving: currentPlayerState.moving,
          rolling: currentPlayerState.rolling,
          current_position: {
            x: 1,
            y: 0,
            previousX: 0,
            previousY: 0,
            targetX: 0,
            targetY: 0,
            angle: 0,
          },
        },
        {
          name: "dog",
          type: "person",
          description: "a dog",
          position: "west",
          moving: currentPlayerState.moving,
          rolling: currentPlayerState.rolling,
          current_position: {
            x: -1,
            y: 0,
            previousX: 0,
            previousY: 0,
            targetX: 0,
            targetY: 0,
            angle: 0,
          },
        },
      ],
    },
    sceneNumber: 1,
    totalNumOfLines: 2,
    recentHistory: [
      {
        character: "cat",
        actions: [{ type: "move", destination: "center" }],
        message: "meow",
      },
      {
        character: "dog",
        actions: [{ type: "move", destination: "north" }],
        message: "woof",
      },
    ],
  });
  const npcRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const localPlayerState = useSnapshot(npcPlayerVisual);
  useFrame(() => {
    if (gameState.current.props.length > 0) {
      const newGameState = {
        ...gameState,
        current: {
          ...gameState.current,
          props: gameState.current.props.map((prop) => {
            if (prop.type == "person") {
              return {
                ...prop,
                moving: localPlayerState.moving,
                rolling: localPlayerState.rolling,
                current_position: {
                  ...prop.current_position,
                  x: prop.current_position.x + 0.01,
                  y: prop.current_position.y + 0.01,
                },
              };
            } else {
              return prop;
            }
          }),
        },
      };

      setGameState({ ...newGameState });
    }
  });

  return (
    <>
      {gameState.current.props.map((prop) => (
        <PropRenderer prop={prop} />
      ))}
    </>
  );
}

const MAGNITUDE = 5;
