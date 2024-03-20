import React from "react";
import { Plane } from "@react-three/drei";
import { radians } from "../../../utils/angles";

const size = 100;

const floorColor = "#677878";

const Floor: React.FC = () => {
  return (
    <>
      <Plane args={[size, size]} rotation={[radians(-90), 0, 0]} receiveShadow>
        <meshStandardMaterial attach="material" color={floorColor} />
      </Plane>
      {/*<gridHelper args={[size, size]}/>*/}
    </>
  );
};

export default Floor;
