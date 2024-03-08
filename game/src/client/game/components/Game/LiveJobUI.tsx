import React, { useEffect } from "react";
import { useInput, useOutput } from "@livestack/client/src";
import { EventResponseZ, GameEventZ } from "../../../../common/game";
import { LiveJobContext } from "./LiveJob";
import styled from "styled-components";
import { useSnapshot, subscribe } from "valtio";
import { playerHealth } from "../../../state/player";

const LiveJobUIStyled = styled.div`
  z-index: 100;
  position: fixed;
  top: 0.5rem;
  // place at the center
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  // glowing effect for better visibility
  text-shadow: 0 0 10px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #ffe100,
    0 0 35px #ffe100, 0 0 40px #ffe100, 0 0 50px #ffe100, 0 0 75px #ffe100;
  color: #000;
`;

export function LiveJobUI() {
  const job = React.useContext(LiveJobContext).mainJob;
  if (!job) {
    return <>Error: cannot connect to the game server</>;
  }
  const playerResponse = useOutput({
    tag: "default",
    def: EventResponseZ,
    job,
  });
  const { feed } = useInput({ tag: "default", def: GameEventZ, job });
  useEffect(() => {
    let prevHealth = playerHealth.health;
    const sub = subscribe(playerHealth, async (messages) => {
      if (feed) {
        for (const [opKey, key, val] of messages) {
          if (opKey === "set" && typeof key === "object") {
            if (key[0] === "health") {
              await feed({
                eventType: "player-health",
                health: Number(val),
                prevHealth: prevHealth,
              });
              prevHealth = Number(val);
            }
          }
        }
      }
    });
    return () => {
      sub();
    };
  }, [feed]);

  return (
    <LiveJobUIStyled>
      {/* <button
        onClick={() =>
          feed({ eventType: "player-move", fromX: 1, fromY: 1, x: -1, y: 0 })
        }
      >
        Player Move
      </button>
      <button onClick={() => feed({ eventType: "player-attack" })}>
        Player Attack
      </button> */}
      <div>{playerResponse?.data.response}</div>
    </LiveJobUIStyled>
  );
}
