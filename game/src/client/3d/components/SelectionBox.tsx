import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface SelectionBoxProps {
  options?: string[];
  onSelect?: (value: string) => void;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ options, onSelect }) => {
  return (
    options &&
    onSelect && (
      <Html position={[0, 1, 0]} center>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelect(option)}
              style={{ margin: "5px", padding: "10px", cursor: "pointer" }}
            >
              {option}
            </button>
          ))}
        </div>
      </Html>
    )
  );
};

// const Scene: React.FC = () => {
//   const [selectedOption, setSelectedOption] = useState<string>('');

//   return (
//     <Canvas>
//       <ambientLight />
//       <SelectionBox
//         options={['Option 1', 'Option 2', 'Option 3']}
//         onSelect={setSelectedOption}
//       />
//     </Canvas>
//   );
// };

export default SelectionBox;
