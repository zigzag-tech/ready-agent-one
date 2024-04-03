import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import { LiveJobContext } from "./LiveJob";
import * as THREE from "three";
import { useOutput } from "@livestack/client/src";
import { gameStateSchema } from "../../../../common/gameStateSchema";

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
  const gameState = useOutput({
    tag: "game-state",
    def: gameStateSchema,
    job,
  });

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
