import { GroupProps } from "@react-three/fiber";
import NPCCharacter from "./NPCCharacter";
import { Html, Hud } from "@react-three/drei";
import { useOutput } from "@livestack/client/src";
import { LiveJobContext } from "../../../game/components/Game/LiveJob";
import React, { useRef } from "react";
import { z } from "zod";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useSnapshot } from "valtio";
import { playerPosition } from "../../../state/positions";
export function NPC({ ...props }: GroupProps) {
  const npcRef = useRef<Group>(null);

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
    tag: "npc-talk",
    job: job1,
    def: z.string(),
  });
  return (
    <group position={position} {...props}>
      {/* <Hud> */}
      <Html
        position={[-1, 9, 0]}
        prepend
        zIndexRange={[100, 0]}
        // position={[position[0], position[1] + 1, position[2]]}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            width: "200px",
            height: "100px",
            borderRadius: "10px",
            border: "1px solid black",
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {resp?.data}
        </div>
      </Html>
      <NPCCharacter
        ref={npcRef}
        lastAttack={0}
        lastDamaged={0}
        moving={false}
        recharging={false}
        running={false}
      />
    </group>
  );
}
