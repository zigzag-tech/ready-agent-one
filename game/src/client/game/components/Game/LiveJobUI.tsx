import React from "react";
import { useInput, useOutput } from "@livestack/client/src";
import { EventResponseZ, GameEventZ } from "../../../../common/game";
import { LiveJobContext } from "./LiveJob";
import styled from "styled-components";

const LiveJobUIStyled = styled.div`
  z-index: 100;
  position: fixed;
  top: 0;
  right: 0;
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
  return (
    <LiveJobUIStyled>
      <button
        onClick={() =>
          feed({ eventType: "player-move", fromX: 1, fromY: 1, x: -1, y: 0 })
        }
      >
        Player Move
      </button>
      <button onClick={() => feed({ eventType: "player-attack" })}>
        Player Attack
      </button>
      <div>{playerResponse?.data.response}</div>
    </LiveJobUIStyled>
  );
}
