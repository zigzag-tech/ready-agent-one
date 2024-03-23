import { GroupProps } from "@react-three/fiber";
import NPCCharacter from "./NPCCharacter";
import { useOutput } from "@livestack/client/src";
import { LiveJobContext } from "../../../game/components/Game/LiveJob";
import React, { useRef } from "react";
import { z } from "zod";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { proxy, useSnapshot } from "valtio";
import { npcPosition, playerPosition } from "../../../state/positions";
import { SpeechBubble } from "../../components/SpeechBubble";
import Alien from "./Alien";

export const npcPlayerVisual = proxy({
  rollCooldown: false,
  rolling: false,
  moving: false,
  running: false,
});

const FOLLOW_SPEED = 0.05; // Adjust this value to change how fast the NPC follows the player
const MINIMAL_DISTANCE = 3; // The minimal distance the NPC should maintain from the player

export function GUY({ ...props }: GroupProps) {
  const npcRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  const localPlayerState = useSnapshot(npcPlayerVisual);

  useFrame(() => {
    if (groupRef.current && playerPosition) {
      // Calculate the direction vector from the NPC to the player
      const direction = new Vector3(
        playerPosition.x - npcPosition.x,
        0,
        playerPosition.y - npcPosition.y
      );
      const distance = direction.length();
      // Normalize the direction vector and scale it by the follow speed
      if (distance > MINIMAL_DISTANCE) {
        npcPlayerVisual.moving = true;
        direction.normalize().multiplyScalar(FOLLOW_SPEED);
        // Update the NPC's position
        npcPosition.x += direction.x;
        npcPosition.y += direction.z;
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

  const position = [0, 0, 12] as [number, number, number];
  const job1 = React.useContext(LiveJobContext).conersationJob;
  if (!job1) return null;

  const resp = useOutput({
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
      {resp?.data.from === "guy" && (
        <SpeechBubble
          content={resp?.data.line}
          position={[0, 9, 0]}
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
      <Alien
        ref={npcRef}
        lastAttack={0}
        lastDamaged={0}
        moving={localPlayerState.moving}
        recharging={false}
        running={localPlayerState.rolling}
      />
    </group>
  );
}

