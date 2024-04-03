import React from "react";
import { useInput, useOutput } from "@livestack/client/src";
import { LiveJobContext } from "./LiveJob";
import styled from "styled-components";

import { gameStateSchema } from "../../../../common/gameStateSchema";

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
  const job = React.useContext(LiveJobContext).conersationJob;
  if (!job) {
    return <>Error: cannot connect to the game server</>;
  }
  const gameState = useOutput({
    tag: "game-state",
    def: gameStateSchema,
    job,
  });

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
      <div>{gameState?.data.current.summary}</div>
      {/* <ul>
        {gameState?.data.current.props.map((prop) => (
          <li key={prop.name}>{prop.name}</li>
        ))}
      </ul> */}
    </LiveJobUIStyled>
  );
}
