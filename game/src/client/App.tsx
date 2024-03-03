<<<<<<< Updated upstream
import { useInput, useJobBinding, useOutput } from "@livestack/client";
import "./App.css";
import { EventResponseZ, GAME_SPEC_NAME, GameEventZ } from "../common/game";

function App() {
  const job = useJobBinding({
    specName: GAME_SPEC_NAME,
  });

  const playerResponse = useOutput({
    tag: "default",
    def: EventResponseZ,
    job,
  });
  const { feed } = useInput({ tag: "default", def: GameEventZ, job });

  return (
    <div className="App">
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
    </div>
=======
import React from 'react';
import Game from "./game/components/Game/Game";
import {GlobalStyle} from "./ui/global";

function App() {
  return (
      <>
        <GlobalStyle/>
        <Game/>
    </>
>>>>>>> Stashed changes
  );
}

export default App;
