import { GroupProps } from "@react-three/fiber";
import NPCCharacter from "./NPCCharacter";
import { useOutput } from "@livestack/client/src";
import { LiveJobContext } from "../../../game/components/Game/LiveJob";
import React, { useRef } from "react";
import { z } from "zod";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { proxy, useSnapshot } from "valtio";
import {
  GameEntityProps,
  NPCConfig,
  playerPosition,
} from "../../../state/positions";
import { SpeechBubble } from "../../components/SpeechBubble";
import Robot from "./Robot";
import Alien from "./Alien";
import { error } from "console";
export const npcPlayerVisual = proxy({
  rollCooldown: false,
  rolling: false,
  moving: false,
  running: false,
});

function GameEntity({ type, localPlayerState }: GameEntityProps) {
  const npcRef = useRef(null);

  // Render the appropriate entity based on the `type` prop
  let EntityComponent;
  switch (type) {
    case "robot":
      EntityComponent = (
        <Robot
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={localPlayerState.moving}
          recharging={false}
          running={localPlayerState.rolling}
        />
      );
      break;
    case "alien":
      EntityComponent = (
        <Alien
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={localPlayerState.moving}
          recharging={false}
          running={localPlayerState.rolling}
        />
      );
      break;
    default:
      throw new Error("Unknown character type: " + type);
  }

  return <>{EntityComponent}</>;
}

export default GameEntity;

const FOLLOW_SPEED = 0.05; // Adjust this value to change how fast the NPC follows the player
const MINIMAL_DISTANCE = 3; // The minimal distance the NPC should maintain from the player

export function NPC({
  npcConfig,
  ...props
}: { npcConfig: NPCConfig } & GroupProps) {
  const npcRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  const localPlayerState = useSnapshot(npcPlayerVisual);

  useFrame(() => {
    if (groupRef.current && playerPosition) {
      // Calculate the direction vector from the NPC to the player
      const direction = new Vector3(
        playerPosition.x - npcConfig.position.x,
        0,
        playerPosition.y - npcConfig.position.y
      );
      const distance = direction.length();
      // Normalize the direction vector and scale it by the follow speed
      if (distance > npcConfig.MINIMAL_DISTANCE) {
        npcPlayerVisual.moving = true;
        direction.normalize().multiplyScalar(npcConfig.FOLLOW_SPEED);
        // Update the NPC's position
        npcConfig.position.x += direction.x;
        npcConfig.position.y += direction.z;
        groupRef.current.position.x += direction.x;
        groupRef.current.position.z += direction.z;
      } else {
        npcPlayerVisual.moving = false;
      }

      const playerVec = new Vector3(
        playerPosition.x,
        groupRef.current.position.y,
        playerPosition.y
      );
      if (npcRef.current && playerVec) {
        npcRef.current.lookAt(playerVec);
      }
    }
  });

  const position = [npcConfig.position.x, 0, npcConfig.position.y] as [
    number,
    number,
    number
  ];
  const job1 = React.useContext(LiveJobContext).conersationJob;
  if (!job1) return null;

  const { last: resp } = useOutput({
    tag: "character-talk",
    job: job1,
    def: z.object({
      from: z.string(),
      line: z.string(),
    }),
  });
  return (
    <group ref={groupRef} position={position} {...props}>
      {/* <Hud> */}
      {resp?.data.from === npcConfig.initialMessage && (
        <SpeechBubble
          content={resp?.data.line}
          position={[-1, 9, 0]}
          zIndexRange={[0, 100]}
        />
      )}

      {/* <NPCCharacter
        ref={npcRef}
        lastAttack={0}
        lastDamaged={0}
        moving={false}
        recharging={false}
        running={false}
      /> */}

      <GameEntity type={npcConfig.type} localPlayerState={localPlayerState} />
    </group>
  );
}
