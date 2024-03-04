import React, {
  useEffect,
  useRef,
  createContext,
  useContext,
  useState,
} from "react";
import nipplejs from "nipplejs";
import { JoystickManager } from "nipplejs";
import styled from "styled-components";

export const NippleContext = createContext<JoystickManager | null>(null);

const StyledContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .nipple {
    pointer-events: none;
  }
`;

export const inputData = {
  lastTouchStart: 0,
  lastTouchEnd: 0,
};

const Joystick = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<any>();

  useEffect(() => {
    const manager = nipplejs.create({
      zone: ref.current,
    });
    setNippleManager(manager);

    return () => {
      manager.destroy();
    };
  }, []);

  const [nippleManager, setNippleManager] = useState<JoystickManager | null>(
    null
  );

  // Provide the nippleManager context to the children

  return (
    <NippleContext.Provider value={nippleManager}>
      <StyledContainer
        ref={ref}
        onTouchStart={() => (inputData.lastTouchStart = Date.now())}
        onTouchEnd={() => (inputData.lastTouchEnd = Date.now())}
      >
        {children}
      </StyledContainer>
    </NippleContext.Provider>
  );
};

export const useNippleManager = () => useContext(NippleContext);

export default Joystick;
