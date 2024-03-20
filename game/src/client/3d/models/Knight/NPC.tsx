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
import Robot from "./Robot";

export const npcPlayerVisual = proxy({
  rollCooldown: false,
  rolling: false,
  moving: false,
  running: false,
});

export function NPC({ ...props }: GroupProps) {
  const npcRef = useRef<Group>(null);
  const localPlayerState = useSnapshot(npcPlayerVisual);

  useFrame(() => {
    if (npcRef.current && playerPosition) {
      const playerVec = new Vector3(
        playerPosition.x,
        npcRef.current.position.y,
        playerPosition.y
      );
      npcRef.current.lookAt(playerVec);
    }
  });

  const position = [0, 0, 3] as [number, number, number];
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
    <group position={position} {...props}>
      {/* <Hud> */}
      {resp?.data.from === "jeremy" && (
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
      <Robot
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

