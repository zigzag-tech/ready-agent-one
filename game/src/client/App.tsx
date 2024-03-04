import React from "react";
import Game from "./game/components/Game/Game";
import { GlobalStyle } from "./ui/global";
import "./App.css";

function App() {
  return (
    <div className="App">
      <GlobalStyle />
      <Game />
    </div>
  );
}

export default App;
