import React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import Floor from "../../../3d/components/Floor/Floor";
import styled from "styled-components";
import Player from "../Player/Player";
import Joystick from "../Joystick/Joystick";
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
import { LiveJob } from "./LiveJob";
import { LiveJobUI } from "./LiveJobUI";
import { NPC } from "../../../3d/models/Knight/NPC";

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
    <LiveJob>
      <FullScreen handle={handle} className="fullscreen-container">
        <StyledContainer>
          <Joystick>
            <Canvas shadows dpr={[1, 1.2]}>
              <GameAI />
              <Physics>
                <Camera />
                <Lights />
                <Floor />
                <Player />
                <NPC />
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
      <LiveJobUI />
    </LiveJob>
  );
};

export default Game;

