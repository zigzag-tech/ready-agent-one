import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiveJobContext } from "./LiveJob";
import * as THREE from "three";
import { gameStateSchema } from "../../../../common/gameStateSchema";
import { z } from "zod";
import Robot from "../../../3d/models/Knight/Robot";
import Alien from "../../../3d/models/Knight/Alien";
import Knight from "../../../3d/models/Knight/Knight";
import { useSnapshot } from "valtio";
import { npcPlayerVisual } from "../../../3d/models/Knight/NPC";
import { useFrame } from "@react-three/fiber";
import { Subject, Observable, interval } from "rxjs";
import { switchMap, take, map, filter } from "rxjs/operators";
interface localPlayerState {
  moving: boolean;
  rolling: boolean;
}
type StateChangeEvent = {
  subject: string;
  fromState: Partial<SubjectState>;
  toState: Partial<SubjectState>;
};

function interpolatePositions(from: { x: number; y: number; }, to: { x: number; y: number; }, steps: number) {
  const dx = (to.x - from.x) / steps;
  const dy = (to.y - from.y) / steps;
  return Array.from({ length: steps }, (_, i) => ({
    x: from.x + dx * i,
    y: from.y + dy * i
  }));
}
function PropRenderer({
  prop,
}: {
  prop: {
    name: string;
    type: string;
    description: string;
    moving: boolean;
    rolling: boolean;
    current_position: {
      x: number;
      y: number;
    };
    target_position: {
      x: number;
      y: number;
    };
  };
}) {
  const pos = useMemo(
    () =>
      new THREE.Vector3(
        prop.current_position.x,
        0,
        prop.current_position.y
      ).multiplyScalar(MAGNITUDE),
    [prop]
  );
  const CharacterComponent = useMemo(() => {
    // Randomly returns either <Robot /> or <Alien />
    const types = [Robot, Alien, Knight];
    return types[Math.floor(Math.random() * types.length)];
  }, []);
  const npcRef = useRef(null);
  if (prop.type == "person") {
    return (
      <group scale={1} position={pos} key={prop.name}>
        <CharacterComponent
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={prop.moving}
          recharging={false}
          running={prop.rolling}
        />
      </group>
    );
  }
}
export const currentPlayerState = {
  moving: false,
  rolling: false,
};
export function PropsManager() {
  const job = React.useContext(LiveJobContext).conersationJob;
  if (!job) {
    return <>Error: cannot connect to the game server</>;
  }
  // const gameState = useOutput({
  //   tag: "game-state",
  //   def: gameStateSchema,
  //   job,
  // });

  // mock gameState
  const [gameState, setGameState] = useState<z.infer<typeof gameStateSchema>>({
    current: {
      summary: "a cat and a dog are in the room",
      props: [
        {
          name: "cat",
          type: "person",
          description: "a cat",
          moving: currentPlayerState.moving,
          rolling: currentPlayerState.rolling,
          current_position: {
            x: 1,
            y: 1,
          },
          target_position: {
            x: -1,
            y: -1,
          },
        },
        {
          name: "dog",
          type: "person",
          description: "a dog",
          moving: currentPlayerState.moving,
          rolling: currentPlayerState.rolling,
          current_position: {
            x: 0,
            y: 0,
          },
          target_position: {
            x: 1,
            y: 1,
          },
        },
      ],
    },
    sceneNumber: 1,
    totalNumOfLines: 2,
    recentHistory: [
      {
        character: "cat",
        actions: [{ type: "move", destination: "center" }],
        message: "meow",
      },
      {
        character: "dog",
        actions: [{ type: "move", destination: "north" }],
        message: "woof",
      },
    ],
  });

  useEffect(() => {
    const subject = new Subject<StateChangeEvent>();
    const obs = subject.pipe(
      filter(event => event.fromState.position !== undefined && event.toState.position !== undefined), // Ensure positions are defined
      switchMap(event => {
        const fromPosition = event.fromState.position!;
        const toPosition = event.toState.position!;
        const duration = 2000; // Duration of the transition
        const intervalTime = 50; // Interval time for updates
        const steps = duration / intervalTime;
        const positions = interpolatePositions(fromPosition, toPosition, steps);
        return interval(intervalTime).pipe(
          take(positions.length),
          map(i => ({
            subject: event.subject,
            position: positions[i]
          }))
        );
      })
    );

    // TODO:
    // 1. transform the observable to incremental position changes every 50ms
    // 2. Instead of useFrame, set the state by subscribing to the final outcome of the observable

    const sub = obs.subscribe(update => {
      setGameState(prevState => ({
        ...prevState,
        current: {
          ...prevState.current,
          props: prevState.current.props.map(prop => 
            prop.name === update.subject ? { ...prop, current_position: update.position, moving : true } : prop
          )
        }
      }));
    });

    (async () => {
      await sleep(1000);
      subject.next({
        subject: "dog",
        fromState: {
          position: {
            x: 0,
            y: 0,
          },
        },
        toState: {
          position: {
            x: 1,
            y: 1,
          },
        },
      });
      await sleep(2000);
      subject.next({
        subject: "cat",
        fromState: {
          position: {
            x: 1,
            y: 1,
          },
        },
        toState: {
          position: {
            x: 0,
            y: 0,
          },
        },
      });
      await sleep(2000);
      subject.next({
        subject: "remote",
        fromState: {
          status: "off",
        },
        toState: {
          status: "on",
        },
      });
      await sleep(2000);
      subject.next({
        subject: "cat",
        fromState: {
          position: {
            x: 0,
            y: 0,
          },
        },
        toState: {
          position: {
            x: 1,
            y: 0,
          },
        },
      });
      await sleep(2000);
      subject.next({
        subject: "remote",
        fromState: {
          status: "on",
        },
        toState: {
          status: "off",
        },
      });
    })();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  // useFrame(() => {
  //   if (gameState.current.props.length > 0) {
  //     const newGameState = {
  //       ...gameState,
  //       current: {
  //         ...gameState.current,
  //         props: gameState.current.props.map((prop) => {
  //           if (
  //             Math.abs(prop.target_position.x - prop.current_position.x) <
  //               0.03 &&
  //             Math.abs(prop.target_position.y - prop.current_position.y) < 0.03
  //           ) {
  //             return {
  //               ...prop,
  //               moving: false,
  //               current_position: {
  //                 ...prop.current_position,
  //                 x: prop.target_position.x,
  //                 y: prop.target_position.y,
  //               },
  //             };
  //           } else if (
  //             prop.type == "person" &&
  //             (prop.target_position.x != prop.current_position.x ||
  //               prop.target_position.y != prop.current_position.y)
  //           ) {
  //             const direction = new THREE.Vector3(
  //               prop.target_position.x - prop.current_position.x,
  //               0,
  //               prop.target_position.y - prop.current_position.y
  //             );
  //             direction.normalize().multiplyScalar(0.01);
  //             return {
  //               ...prop,
  //               moving: true,
  //               current_position: {
  //                 ...prop.current_position,
  //                 x: prop.current_position.x + direction.x,
  //                 y: prop.current_position.y + direction.z,
  //               },
  //             };
  //           } else {
  //             return {
  //               ...prop,
  //               moving: false,
  //             };
  //           }
  //         }),
  //       },
  //     };

  //     setGameState({ ...newGameState });
  //   }
  // });

  return (
    <>
      {gameState.current.props.map((prop) => (
        <PropRenderer prop={prop} />
      ))}
    </>
  );
}

const MAGNITUDE = 5;

type SubjectState = {
  position: {
    x: number;
    y: number;
  };
  status: string;
};



async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}