import React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import Floor from "../../../3d/components/Floor/Floor";
import styled from "styled-components";
import Player from "../Player/Player";
import Joystick from "../Joystick/Joystick";
import { NippleContext } from "../Joystick/Joystick";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import Lights from "../Lights/Lights";
import Camera from "../Camera/Camera";
import Physics from "../../../physics/components/Physics/Physics";
import GameUI from "./components/GameUI/GameUI";
import AttackColliders from "./components/AttackColliders/AttackColliders";

import Room from "../Room/Room";
import GameAI from "./components/GameAI/GameAI";
import MobsManager from "../MobsManager/MobsManager";
import AttackUIContainer from "./components/AttackUIContainer/AttackUIContainer";
import PhysWall from "../PhysWall/PhysWall";

export const STATS_CSS_CLASS = "stats";

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const Game: React.FC = () => {
  const handle = useFullScreenHandle();
  const { active, enter } = handle;

  return (
    <FullScreen handle={handle} className="fullscreen-container">
      <StyledContainer>
        <Joystick>
          <Canvas shadows>
            <GameAI />
            <Physics>
              <Camera />
              <Lights />
              <Floor />
              <Player />
              {/*<OldMob/>*/}
              <MobsManager />
              <AttackColliders />
              <Stats className={STATS_CSS_CLASS} />
              <Room />
              {/* <PhysWall /> */}
              {/*<TestBox/>*/}
            </Physics>
          </Canvas>
        </Joystick>
        <GameUI />
        <AttackUIContainer />
      </StyledContainer>
    </FullScreen>
  );
};

export default Game;
