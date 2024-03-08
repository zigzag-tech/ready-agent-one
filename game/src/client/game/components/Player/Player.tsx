import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { inputData, useNippleManager } from "../Joystick/Joystick";
import { useFrame } from "@react-three/fiber";
import { radians, rotateVector } from "../../../utils/angles";
import { gameRefs } from "../../../state/refs";
import { playerPosition } from "../../../state/positions";
import { usePlayerControls } from "./hooks/controls";
import { InputKeys, inputsState } from "../../../state/inputs";
import { lerpRadians, numLerp, PI, PI_TIMES_TWO } from "../../../utils/numbers";
import { DIAGONAL } from "../../../utils/common";
import { Vec2 } from "planck";
import { usePlayerPhysics } from "./hooks/physics";
import PlayerVisuals, {
  playerVisualState,
} from "./components/PlayerVisuals/PlayerVisuals";
import PlayerDebug from "./components/PlayerDebug/PlayerDebug";
import {
  JUICE_RECHARGE_COST,
  playerCanRecharge,
  playerEnergy,
  playerJuice,
  playerState,
  rechargePlayer,
  usePlayerHasTarget,
  usePlayerInCombat,
} from "../../../state/player";
import { usePlayerCollisionsHandler } from "./hooks/collisions";
import { usePlayerEffectsHandler } from "./hooks/effects";
import { usePlayerStateHandler } from "./hooks/state";
import PlayerUI from "./components/PlayerUI/PlayerUI";
import {
  attackInputData,
  attackStateProxy,
} from "../Game/components/AttackUIContainer/components/AttackUI/AttackUI";
import { Html } from "@react-three/drei";
import { useInput, useOutput } from "@livestack/client/src";
import { z } from "zod";
import { LiveJobContext } from "../Game/LiveJob";

export const coroutine = (f: any, params: any[] = []) => {
  const o = f(...params); // instantiate the coroutine
  return function (x: any) {
    return o.next(x);
  };
};

enum RechargeState {
  PENDING,
  ACTIVATED,
}

const beginPreRechargeProcess = () => {
  playerState.preRecharging = true;
};

const beginRechargeProcess = () => {
  playerState.recharging = true;
};

const endRechargeProcess = () => {
  playerState.preRecharging = false;
  playerState.recharging = false;
};

const rechargeCoroutine = function* () {
  const start = Date.now();
  const wait = start + 500;
  const completion = wait + 750;
  beginPreRechargeProcess();
  let rechargePressed = true;
  while (Date.now() < wait) {
    if (!rechargePressed || !playerState.preRecharging) {
      endRechargeProcess();
      return;
    }
    rechargePressed = yield RechargeState.PENDING;
  }
  beginRechargeProcess();
  while (Date.now() < completion) {
    yield RechargeState.ACTIVATED;
  }
  rechargePlayer();
  endRechargeProcess();
};

const rollCooldownCoroutine = function* () {
  let wait = Date.now() + 500;
  playerVisualState.rollCooldown = true;
  while (Date.now() < wait) {
    yield null;
  }
  playerVisualState.rollCooldown = false;
};

const rollCoroutine = function* () {
  let wait = Date.now() + 500;
  playerVisualState.rolling = true;
  while (Date.now() < wait) {
    yield null;
  }
  playerVisualState.rolling = false;
};

const rechargeManager: {
  rechargeCoroutine: any;
} = {
  rechargeCoroutine: null,
};

const rollManager: {
  lastRolled: number;
  rollCoroutine: any;
  cooldownCoroutine: any;
} = {
  lastRolled: 0,
  rollCoroutine: null,
  cooldownCoroutine: null,
};

const nippleState = {
  active: false,
};

const playerLocalState = {
  xVelocity: 0,
  yVelocity: 0,
  rollXVelocity: 0,
  rollYVelocity: 0,
};

const playerJoystickVelocity = {
  x: 0,
  y: 0,
  previousX: 0,
  previousY: 0,
  targetAngle: 0,
};

const WALKING_SPEED = 5;
const COMBAT_WALKING_SPEED = WALKING_SPEED * 1.25;
const RUNNING_SPEED = WALKING_SPEED * 2;
const ROLLING_SPEED = RUNNING_SPEED;

const tempVec2 = Vec2(0, 0);

const Player: React.FC = () => {
  const nippleManager = useNippleManager();
  const [ref, api, largeColliderRef, largeColliderApi] = usePlayerPhysics();

  usePlayerCollisionsHandler(api);
  usePlayerControls();
  usePlayerEffectsHandler();
  usePlayerStateHandler();
  const targetLocked = usePlayerHasTarget();
  const inCombat = usePlayerInCombat();

  useEffect(() => {
    gameRefs.player = ref.current;
  }, []);

  useEffect(() => {
    nippleManager &&
      nippleManager.on("start", () => {
        nippleState.active = true;
        if (inputData.lastTouchStart > Date.now() - 450) {
          inputsState[InputKeys.SHIFT].rawLastPressed = Date.now();
          inputsState[InputKeys.SHIFT].raw = true;
        }
      });

    nippleManager &&
      nippleManager.on("end", () => {
        nippleState.active = false;
        playerJoystickVelocity.previousX = 0;
        playerJoystickVelocity.previousY = 0;
        playerJoystickVelocity.x = 0;
        playerJoystickVelocity.y = 0;
        inputsState[InputKeys.SHIFT].raw = false;
      });

    nippleManager &&
      nippleManager.on("move", (_, data) => {
        const { x, y } = data.vector;
        playerJoystickVelocity.previousX = playerJoystickVelocity.x;
        playerJoystickVelocity.previousY = playerJoystickVelocity.y;
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
          playerJoystickVelocity.x = 0;
          playerJoystickVelocity.y = 0;
          return;
        }
        playerJoystickVelocity.x = x * -1;
        playerJoystickVelocity.y = y;
      });
  }, []);

  const applyVelocity = useCallback(
    (x: number, y: number) => {
      tempVec2.set(x, y);
      api.setLinearVelocity(tempVec2);
      largeColliderApi.setLinearVelocity(tempVec2);
      playerLocalState.xVelocity = x;
      playerLocalState.yVelocity = y;
    },
    [api, largeColliderApi]
  );

  useFrame(({ gl, scene, camera }, delta) => {
    if (!ref.current) return;

    const { previousX, previousY } = playerPosition;

    playerPosition.previousX = playerPosition.x;
    playerPosition.previousY = playerPosition.y;
    //largeColliderApi.setAngle(ref.current.rotation.y)

    const { x, z: y } = ref.current.position;

    tempVec2.set(x, y);
    largeColliderApi.setPosition(tempVec2);

    let xVel = numLerp(
      playerJoystickVelocity.previousX,
      playerJoystickVelocity.x,
      0.75
    );
    let yVel = numLerp(
      playerJoystickVelocity.previousY,
      playerJoystickVelocity.y,
      0.75
    );
    let energy = playerEnergy.energy;

    if (!nippleState.active) {
      let up = inputsState[InputKeys.UP].active;
      let right = inputsState[InputKeys.RIGHT].active;
      let down = inputsState[InputKeys.DOWN].active;
      let left = inputsState[InputKeys.LEFT].active;
      xVel = left ? 1 : right ? -1 : 0;
      yVel = up ? 1 : down ? -1 : 0;

      if (xVel !== 0 && yVel !== 0) {
        xVel = xVel * DIAGONAL;
        yVel = yVel * DIAGONAL;
      }
    }

    let rechargeAttempt =
      inputsState[InputKeys.RECHARGE].active && playerCanRecharge();
    let canMove = !rechargeAttempt;
    let isRechargingActivated = false;

    const [adjustedXVel, adjustedYVel] = rotateVector(xVel, yVel, -45);

    xVel = adjustedXVel;
    yVel = adjustedYVel;

    if (rechargeManager.rechargeCoroutine) {
      const rechargeResponse =
        rechargeManager.rechargeCoroutine(rechargeAttempt);

      if (rechargeResponse.done) {
        rechargeManager.rechargeCoroutine = null;
      } else if (rechargeResponse.value === RechargeState.ACTIVATED) {
        isRechargingActivated = true;
      }
    } else if (rechargeAttempt) {
      rechargeManager.rechargeCoroutine = coroutine(rechargeCoroutine);
    }

    if (isRechargingActivated) {
      xVel = 0;
      yVel = 0;
      canMove = false;
    }

    const ongoingRoll = !!rollManager.rollCoroutine;
    const canRoll =
      (canMove &&
        inCombat &&
        rollManager.lastRolled < Date.now() - 1000 &&
        !playerVisualState.rollCooldown &&
        energy >= 33) ||
      ongoingRoll;

    const isRolling = canRoll && inputsState[InputKeys.SHIFT].active;
    const isMoving = canMove && (xVel !== 0 || yVel !== 0);
    const isRunning =
      canMove && inputsState[InputKeys.SHIFT].active && !inCombat && energy > 0;

    if (!!rollManager.cooldownCoroutine) {
      if (rollManager.cooldownCoroutine().done) {
        rollManager.cooldownCoroutine = null;
      }
    }

    if (ongoingRoll) {
      let speed = ROLLING_SPEED;

      const adjustedXVel = xVel * speed;
      const adjustedYVel = yVel * speed;

      if (nippleState.active) {
        xVel = numLerp(playerLocalState.rollXVelocity, adjustedXVel, 0.1);
        yVel = numLerp(playerLocalState.rollYVelocity, adjustedYVel, 0.1);
      } else {
        xVel = playerLocalState.rollXVelocity;
        yVel = playerLocalState.rollYVelocity;
      }

      const response = rollManager.rollCoroutine();

      if (response.done) {
        rollManager.rollCoroutine = null;
        rollManager.cooldownCoroutine = coroutine(rollCooldownCoroutine);
      }

      playerLocalState.rollXVelocity = xVel;
      playerLocalState.rollYVelocity = yVel;

      applyVelocity(xVel, yVel);
    } else if (isMoving) {
      const preSpeedXVel = xVel;
      const preSpeedYVel = yVel;

      let speed = isRolling
        ? ROLLING_SPEED
        : isRunning
        ? RUNNING_SPEED
        : inCombat
        ? COMBAT_WALKING_SPEED
        : WALKING_SPEED;

      const adjustedXVel = xVel * speed;
      const adjustedYVel = yVel * speed;

      if (isRolling) {
        const rollAngle = Math.atan2(preSpeedYVel, preSpeedXVel);

        const rollX = Math.cos(rollAngle) * speed;
        const rollY = Math.sin(rollAngle) * speed;

        playerLocalState.rollXVelocity = rollX;
        playerLocalState.rollYVelocity = rollY;

        rollManager.rollCoroutine = coroutine(rollCoroutine);
        rollManager.lastRolled = Date.now();
        energy -= 33;
      } else if (isRunning) {
        const energyUsed = delta * 15;

        energy -= energyUsed;
      }

      applyVelocity(adjustedXVel, adjustedYVel);
    } else {
      applyVelocity(0, 0);
    }

    let prevAngle = ref.current.rotation.y; // convert to low equivalent angle
    if (prevAngle > PI) {
      prevAngle -= PI_TIMES_TWO;
    }

    const isTargetLocked = targetLocked;

    const attackInputActive = attackStateProxy.attackEngaged;

    const applyAttackAngle = () => {
      const [attackXVel, attackYVel] = rotateVector(
        attackInputData.xVel,
        attackInputData.yVel,
        45
      );
      const angle = Math.atan2(-attackYVel, attackXVel) - radians(270);
      playerJoystickVelocity.targetAngle = angle;

      if (prevAngle !== angle) {
        ref.current.rotation.y = lerpRadians(prevAngle, angle, 10 * delta);
      }
    };

    if (!ongoingRoll && attackInputActive) {
      applyAttackAngle();
    } else if (isTargetLocked && !ongoingRoll) {
      const targetX = playerPosition.targetX;
      const targetY = playerPosition.targetY;
      const angle = Math.atan2(targetX - x, targetY - y);
      ref.current.rotation.y = lerpRadians(prevAngle, angle, 10 * delta);
      playerJoystickVelocity.targetAngle = angle;
    } else if (
      !ongoingRoll &&
      attackInputData.lastReleased > Date.now() - 1000
    ) {
      applyAttackAngle();
    } else {
      if (isMoving) {
        const angle = Math.atan2(-yVel, xVel) - radians(270);
        playerJoystickVelocity.targetAngle = angle;
      }

      if (prevAngle !== playerJoystickVelocity.targetAngle) {
        ref.current.rotation.y = lerpRadians(
          prevAngle,
          playerJoystickVelocity.targetAngle,
          10 * delta
        );
      }
    }

    if (playerVisualState.moving !== isMoving) {
      playerVisualState.moving = isMoving;
    }

    if (playerVisualState.running !== isRunning) {
      playerVisualState.running = isRunning;
    }

    if (energy < 0) {
      energy = 0;
    }

    playerEnergy.energy = energy;

    // update player position

    playerPosition.x = x;
    playerPosition.y = y;
    playerPosition.angle = ref.current.rotation.y;

    largeColliderApi.setAngle(ref.current.rotation.y * -1);

    gl.render(scene, camera);
  }, 100);
  const job1 = React.useContext(LiveJobContext).conersationJob;
  if (!job1) return null;

  const resp = useOutput({
    tag: "player-talk",
    job: job1,
    def: z.string(),
  });
  const { feed } = useInput({
    tag: "player-input",
    def: z.string(),
    job: job1,
  });

  useEffect(() => {
    feed && feed("yello");
  }, [feed]);

  return (
    <>
      <group position={[0, 0, 0]} ref={ref}>
        <Html
          position={[0, -1, 0]}
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
        <PlayerVisuals />
        <PlayerUI />
      </group>
      <PlayerDebug largeColliderRef={largeColliderRef} />
    </>
  );
};

export default Player;
