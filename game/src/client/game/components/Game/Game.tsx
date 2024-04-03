import React, { useEffect, useRef, useState } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  Billboard,
  Html,
  Hud,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Stats,
  View,
  useFBO,
  useHelper,
} from "@react-three/drei";
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
import { create } from "zustand";

import Room from "../Room/Room";
import GameAI from "./components/GameAI/GameAI";
import MobsManager from "../MobsManager/MobsManager";
import AttackUIContainer from "./components/AttackUIContainer/AttackUIContainer";
import { LiveJob } from "./LiveJob";
import { LiveJobUI } from "./LiveJobUI";
import { NPC } from "../../../3d/models/Knight/NPC";
import { Leva, useControls } from "leva";
import * as THREE from "three";

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
                {/* <MiniMap /> */}
                {/* <MyCamera
                  // animate={(ref, state) => {
                  //   ref.position.x = Math.sin(state.clock.getElapsedTime()) * 5;
                  //   ref.position.y = Math.cos(state.clock.getElapsedTime()) * 5;
                  // }}
                  near={1}
                  label="A"
                  position={[0, 10, 0]}
                /> */}
                {/* <Render /> */}
                <Camera />
                <Lights />
                <Floor />
                <Player />
                {/* <NPC /> */}
                {/* <GUY /> */}
                {/*<OldMob/>*/}
                {/* <MobsManager /> */}
                {/* <AttackColliders /> */}
                {/* <Stats className={STATS_CSS_CLASS} /> */}
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
/** Using a centralized store to pass around the cameras */
const useStore = create((set, get) => ({
  ACam: null,
  BCam: null,
}));

import { playerPosition } from "../../../state/positions";
import { GUY } from "../../../3d/models/Knight/GUY";

function Render() {
  const aTarget = useFBO(window.innerWidth / 4, window.innerHeight / 4);

  const { ACam } = useStore((state) => ({
    ACam: state.ACam,
    // BCam: state.BCam,
  }));

  const mnm = new THREE.MeshNormalMaterial();

  const guiScene = new THREE.Scene();
  const guiCamera = React.useRef();

  // just to make component re-render on canvas size change
  useThree();

  const debugBG = new THREE.Color("#fff");
  const originalBg = new THREE.Color("#080406");

  useFrame(({ gl, camera, scene }) => {
    gl.autoClear = false;

    scene.background = debugBG;

    /** Render scene from camera A to a render target */
    scene.overrideMaterial = mnm;
    gl.setRenderTarget(aTarget);
    gl.render(scene, ACam.current);

    /** Render scene from camera B to a different render target */
    // scene.overrideMaterial = dmm;
    // gl.setRenderTarget(bTarget);
    // gl.render(scene, BCam.current);

    scene.background = originalBg;
    // render main scene
    scene.overrideMaterial = null;
    gl.setRenderTarget(null);
    gl.render(scene, camera);

    // render GUI panels on top of main scene
    // gl.render(guiScene, guiCamera.current);
    gl.autoClear = true;
  }, 1);

  const r = window.innerWidth / window.innerHeight;
  const SIZE = 10;

  /**
   * Just some planes  + boring calculations to make them stick to the side of the screen
   */
  return (
    <>
      {/* <OrthographicCamera ref={guiCamera} near={0.0001} far={1} /> */}

      <Billboard>
        <Plane args={[SIZE, SIZE / r, 1]}>
          <meshBasicMaterial map={aTarget.texture} />
        </Plane>
      </Billboard>
      {/* <Billboard>
        <Plane args={[SIZE, SIZE / r, 1]}>
          <meshBasicMaterial map={bTarget.texture} />
        </Plane>
      </Billboard> */}
    </>
    // guiScene
  );
}
