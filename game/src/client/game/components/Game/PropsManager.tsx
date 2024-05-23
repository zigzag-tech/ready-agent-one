import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiveJobContext } from "./LiveJob";
import * as THREE from "three";
import {
  gameStateSchema,
  historyEntrySchema,
} from "../../../../common/gameStateSchema";
import { z } from "zod";
import Robot from "../../../3d/models/Knight/Robot";
import Alien from "../../../3d/models/Knight/Alien";
import Knight from "../../../3d/models/Knight/Knight";
import { useSnapshot } from "valtio";
import { npcPlayerVisual } from "../../../3d/models/Knight/NPC";
import { useFrame } from "@react-three/fiber";
import { Subject, Observable, interval } from "rxjs";
import { switchMap, take, map, filter } from "rxjs/operators";
import { alienCaveInitialInput } from "../../../../common/alien-cave";
import { useInput, useOutput } from "@livestack/client/src";
import { characterOutputSchema } from "../../../../common/characterOutputSchema";
import { SpeechBubble } from "../../../3d/components/SpeechBubble";
import { Html, Text } from "@react-three/drei";
interface localPlayerState {
  moving: boolean;
  rolling: boolean;
}
type StateChangeEvent = {
  subject: string;
  fromState: Partial<SubjectState>;
  toState: Partial<SubjectState>;
};

type ConversationEvent = {
  subject: string;
  content: string;
};

type MoveEvent = {
  subject: string;
  position: { x: number; y: number };
};

function interpolatePositions(
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps: number
) {
  const dx = (to.x - from.x) / steps;
  const dy = (to.y - from.y) / steps;
  return Array.from({ length: steps }, (_, i) => ({
    x: from.x + dx * i,
    y: from.y + dy * i,
  }));
}
function PropRenderer({
  prop,
}: {
  prop: {
    name: string;
    type: string;
    moving?: boolean;
    rolling?: boolean;
    description: string;
    speech?: string | null;
    currentPosition: { x: number; y: number; z: number };
  };
}) {
  // const [moving, setMoving] = useState(false);
  // const [rolling, setRolling] = useState(false);

  const { currentPosition } = prop;
  const pos = useMemo(
    () =>
      new THREE.Vector3(
        currentPosition.x,
        currentPosition.y,
        currentPosition.z
      ).multiplyScalar(MAGNITUDE),
    [currentPosition]
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
        {prop.speech && <SpeechBubble content={prop.speech} position={pos} />}
        <CharacterComponent
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={!!prop.moving}
          recharging={false}
          running={!!prop.rolling}
        />
      </group>
    );
  } else {
    // render a tetrohedron with a label for now
    return (
      <group scale={1} position={pos} key={prop.name}>
        <mesh>
          <tetrahedronGeometry args={[1]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Html>
          <div
            style={{
              color: "black",
              backgroundColor: "white",
              padding: 10,
              borderRadius: 10,
            }}
          >
            {prop.name}
          </div>
        </Html>
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
  const { feed: feedSupervision } = useInput({
    job,
    tag: "summary-supervision",
    def: gameStateSchema,
  });

  const [speechByCharacter, setSpeechByCharacter] = useState<
    Record<string, string | null>
  >({});

  const [stateByProp, setStateByProp] = useState<
    Record<
      string,
      {
        currentPosition: {
          x: number;
          y: number;
        };
        moving: boolean;
        rolling: boolean;
      }
    >
  >({});

  useEffect(() => {
    feedSupervision && feedSupervision(alienCaveInitialInput);
  }, [feedSupervision]);

  // mock gameState
  // const [gameState, setGameState] = useState<z.infer<typeof gameStateSchema>>(
  //   alienCaveInitialInput
  // );

  const [stateD] = useOutput({
    job,
    tag: "game-state",
    def: gameStateSchema,
    query: {
      type: "lastN",
      n: 1,
    },
  });
  const gameState = useMemo(() => stateD?.data, [stateD]);
  useEffect(() => {
    if (gameState) {
      setStateByProp((prev) => {
        const newState = {} as typeof prev;
        for (const prop of gameState.current.props) {
          newState[prop.name] = {
            currentPosition: prop.position || { x: 0, y: 0 },
            moving: false,
            rolling: false,
          };
        }
        return newState;
      });
    }
  }, [gameState]);

  

  useEffect(() => {
    if (job && gameState) {
      const conversationSubject = new Subject<ConversationEvent>();
      const moveSubject = new Subject<MoveEvent>();

      const obs = moveSubject.pipe(
        filter((event) => !!event.position), // Ensure positions are defined
        switchMap((event) => {
          const toPosition = event.position!;
          const fromPosition = gameState.current.props.find(
            (prop) => prop.name === event.subject
          )?.position || { x: 0, y: 0 }; // Get the current position of the subject

          const duration = 2000; // Duration of the transition
          const intervalTime = 50; // Interval time for updates
          const steps = duration / intervalTime;
          const positions = interpolatePositions(
            fromPosition,
            toPosition,
            steps
          );
          return interval(intervalTime).pipe(
            take(positions.length),
            map((i) => ({
              subject: event.subject,
              position: positions[i],
              isFinal: i === positions.length - 1, // Check if it's the final step
            }))
          );
        })
      );

      const sub = obs.subscribe((update) => {
        setStateByProp((prev) => ({
          ...prev,
          [update.subject]: {
            currentPosition: {
              ...update.position,
            },
            moving: true,
            rolling: true,
          },
        }));
        // setGameState((prevState) => ({
        //   ...prevState,
        //   current: {
        //     ...prevState.current,
        //     props: prevState.current.props.map(
        //       (prop) =>
        //         prop.name === update.subject
        //           ? {
        //               ...prop,
        //               current_position: update.position,
        //               moving: !update.isFinal,
        //             }
        //           : prop // Set moving to false if it's the final update
        //     ),
        //   },
        // }));
      });

      (async () => {
        console.log("subToStream", (await job.connRef?.current)?.subToStream);
        (await job.connRef?.current)?.subToStream<
          z.infer<typeof historyEntrySchema>
        >(
          {
            type: "output",
            tag: "history-entries",
            query: {
              type: "lastN",
              n: 1,
            },
          },
          (data) => {
            for (const action of data.data.actions) {
              if (action.action.startsWith("talk")) {
                conversationSubject.next({
                  subject: data.data.subject,
                  content: action.message || "...",
                });
              } else if (
                ["move_to", "walk_to", "run_to"].includes(action.action)
              ) {
                moveSubject.next({
                  subject: data.data.subject,
                  position: action.destination || {
                    x: 0,
                    y: 0,
                  },
                });
              }
            }
          }
        );
      })();

      // subscribe to conversation events and update the character's speech
      const convoSub = conversationSubject.subscribe((event) => {
        setSpeechByCharacter((prevState) => ({
          [event.subject]: event.content,
        }));
      });

      // const convoSub = conversationSubject.subscribe((event) => {
      //   setGameState((prevState) => ({
      //     ...prevState,
      //     current: {
      //       ...prevState.current,
      //       props: prevState.current.props.map((prop) =>
      //         prop.name === event.subject
      //           ? {
      //               ...prop,
      //               conversation: event.content,
      //             }
      //           : prop
      //       ),
      //     },
      //   }));
      // });

      return () => {
        sub.unsubscribe();
        // convoSub.unsubscribe();
      };
    }
  }, [job, gameState]);

  return (
    <>
      {gameState?.current.props.map((prop) => (
        <PropRenderer
          prop={{
            ...prop,
            speech: speechByCharacter[prop.name] || null,

            currentPosition: {
              x: (stateByProp[prop.name]?.currentPosition.x || 0) / 5,
              y: 0,
              z: (stateByProp[prop.name]?.currentPosition.y || 0) / 5,
            },
          }}
        />
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