import { GroupProps } from "@react-three/fiber";
import NPCCharacter from "./NPCCharacter";
export function NPC({ ...props }: GroupProps) {
  return (
    <group position={[0, 0, 3]} rotation={[0, Math.PI, 0]} {...props}>
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
