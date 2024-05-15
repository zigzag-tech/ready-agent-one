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
    description: string;
    speech?: string;
  };
}) {
  const [moving, setMoving] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
  });
  const pos = useMemo(
    () =>
      new THREE.Vector3(currentPosition.x, 0, currentPosition.y).multiplyScalar(
        MAGNITUDE
      ),
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
        {
          prop.speech && <SpeechBubble content={prop.speech}  position={pos}/>
        }
        <CharacterComponent
          ref={npcRef}
          lastAttack={0}
          lastDamaged={0}
          moving={moving}
          recharging={false}
          running={rolling}
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
  const { feed } = useInput({
    job,
    tag: "summary-supervision",
    def: gameStateSchema,
  });

  useEffect(() => {
    feed && feed(alienCaveInitialInput);
  }, [feed]);

  // mock gameState
  const [gameState, setGameState] = useState<z.infer<typeof gameStateSchema>>(
    alienCaveInitialInput
  );

  useEffect(() => {
    if (job) {
      const eventSubject = new Subject<StateChangeEvent>();
      const conversationSubject = new Subject<ConversationEvent>();
      const obs = eventSubject.pipe(
        filter(
          (event) =>
            event.fromState.position !== undefined &&
            event.toState.position !== undefined
        ), // Ensure positions are defined
        switchMap((event) => {
          const fromPosition = event.fromState.position!;
          const toPosition = event.toState.position!;
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
        setGameState((prevState) => ({
          ...prevState,
          current: {
            ...prevState.current,
            props: prevState.current.props.map(
              (prop) =>
                prop.name === update.subject
                  ? {
                      ...prop,
                      current_position: update.position,
                      moving: !update.isFinal,
                    }
                  : prop // Set moving to false if it's the final update
            ),
          },
        }));
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
              }
            }
          }
        );
      })();

      const convoSub = conversationSubject.subscribe((event) => {
        setGameState((prevState) => ({
          ...prevState,
          current: {
            ...prevState.current,
            props: prevState.current.props.map((prop) =>
              prop.name === event.subject
                ? {
                    ...prop,
                    conversation: event.content,
                  }
                : prop
            ),
          },
        }));
      });

      return () => {
        sub.unsubscribe();
        convoSub.unsubscribe();
      };
    }
  }, [job]);

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