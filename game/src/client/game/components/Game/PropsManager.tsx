import React, { useEffect, useMemo, useState } from "react";
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
    // curent_position: {
    //   x: number;
    //   y: number;
    //   previousX: number;
    //   previousY: number;
    //   targetX: number;
    //   targetY: number;
    //   angle: number;
    // };
  };
}) {
  const pos = useMemo(() => convertPositionToVector3(prop), [prop]);
  const CharacterComponent = useMemo(() => {
    // Randomly returns either <Robot /> or <Alien />
    const types = [Robot, Alien, Knight];
    return types[Math.floor(Math.random() * types.length)];
  }, []);
  if (prop.type == 'person') {
    return (
      <group scale={1} position={pos} key={prop.name}>
        <CharacterComponent
          ref={null}
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
  const [gameState, setGameState] = useState<{
    data: z.infer<typeof gameStateSchema>;
  }>({
    data: {
      current: {
        summary: "a cat and a dog are in the room",
        props: [
          {
            name: "cat",
            type: "person",
            description: "a cat",
            position: "center",
            moving: false,
            rolling: false,
          },
          {
            name: "dog",
            type: "person",
            description: "a dog",
            position: "north",
            moving: false,
            rolling: false,
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
    },
  });
  const localPlayerState = useSnapshot(npcPlayerVisual);
  useEffect(() => {
    if (gameState?.data.current.props.length || 0 > 1) {
      (async () => {
        // sleep 1000
        await new Promise((resolve) => setTimeout(resolve, 1000));


        //If there are two characters, Move the first character towards the second character.
        const catProp = gameState?.data.current.props.find(prop => prop.name === 'cat');
        const dogProp = gameState?.data.current.props.find(prop => prop.name === 'dog');
        if (catProp && dogProp) {

        }
      })();
    }
  }, [gameState]);

  return (
    <>
      {gameState?.data.current.props.map((prop) => (
        <PropRenderer prop={prop} />
      ))}
    </>
  );
}

const MAGNITUDE = 5;
function convertPositionToVector3({
  name,
  type,
  description,
  position,
}: {
  name: string;
  type: string;
  description: string;
  position: string;
}) {
  if (position === "center") {
    return new THREE.Vector3(0, 0, 0).multiplyScalar(MAGNITUDE);
  } else if (position === "north") {
    return new THREE.Vector3(0, 0, -1).multiplyScalar(MAGNITUDE);
  } else if (position === "south") {
    return new THREE.Vector3(0, 0, 1).multiplyScalar(MAGNITUDE);
  } else if (position === "east") {
    return new THREE.Vector3(1, 0, 0).multiplyScalar(MAGNITUDE);
  } else if (position === "west") {
    return new THREE.Vector3(-1, 0, 0).multiplyScalar(MAGNITUDE);
  } else {
    // return a random position for now
    const posX = Math.random();
    const posZ = Math.random();

    return new THREE.Vector3(posX, 0, posZ).multiplyScalar(MAGNITUDE);
  }
}
