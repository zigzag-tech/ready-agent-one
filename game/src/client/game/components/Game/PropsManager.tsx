import React, { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { LiveJobContext } from "./LiveJob";
import * as THREE from "three";
import { useOutput } from "@livestack/client/src";
import { gameStateSchema } from "../../../../common/gameStateSchema";
import { z } from "zod";
function PropRenderer({
  prop,
}: {
  prop: {
    name: string;
    type: string;
    description: string;
    position: string;
  };
}) {
  const pos = useMemo(() => convertPositionToVector3(prop), [prop]);
  // if type is person, render a random character
  // TODO: render a character

  return (
    <group scale={2} position={pos} key={prop.name}>
      <mesh>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      <Html>{prop.name}</Html>
    </group>
  );
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
          },
          {
            name: "dog",
            type: "person",
            description: "a dog",
            position: "north",
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

  useEffect(() => {
    if (gameState?.data.current.props.length || 0 > 1) {
      (async () => {
        // sleep 1000
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // TODO:
        // 1. understand how player moves and how NPC follows player. Understand how valtio works.
        // 2. If there are two characters, Move the first character towards the second character.
        console.log("TODO");
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
