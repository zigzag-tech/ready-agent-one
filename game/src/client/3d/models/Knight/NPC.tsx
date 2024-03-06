import { GroupProps } from "@react-three/fiber";
import NPCCharacter from "./NPCCharacter";
import { Html, Hud } from "@react-three/drei";
export function NPC({ ...props }: GroupProps) {
  const position = [0, 0, 3] as [number, number, number];
  return (
    <group position={position} rotation={[0, Math.PI, 0]} {...props}>
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
          }}
        >
          <p>Hey there! I'm an NPC!</p>
        </div>
      </Html>
      {/* </Hud> */}
      <NPCCharacter
        lastAttack={0}
        lastDamaged={0}
        moving={false}
        recharging={false}
        running={false}
      />
    </group>
  );
}
