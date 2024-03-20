import React from "react";

const Lights: React.FC = () => {
  return (
    <>
      <ambientLight intensity={2.0} />
      <directionalLight
        intensity={0.8}
        position={[0, 10, 0]}
        castShadow
      />
    </>
  );
};

export default Lights;
