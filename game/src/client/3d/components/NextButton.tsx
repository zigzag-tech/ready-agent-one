import React, { useEffect, useState } from "react";
import { LiveJobContext } from "../../game/components/Game/LiveJob";
import { useInput, useOutput } from "@livestack/client";
import { z } from "zod";

export function NextButton() {
  const [hidden, setHidden] = useState(true);

  const job = React.useContext(LiveJobContext).conersationJob;
  if (!job) {
    return <>Error: cannot connect to the game server</>;
  }

  const { feed: sendUserSignal } = useInput({
    job,
    tag: "user-signal",
    def: z.string(),
  });

  const [userSignalBackend] = useOutput({
    job,
    tag: "needs-user-signal",
    def: z.string(),
    query: {
      type: "lastN",
      n: 1,
    },
  });

  useEffect(() => {
    setHidden(false);
  }, [userSignalBackend]);

  const handleClick = () => {
    sendUserSignal && sendUserSignal("next");
    setHidden(true);
  };
  return (
    !hidden && (
      <button
        onClick={handleClick}
        style={{
          margin: "5px",
          padding: "10px",
          cursor: "pointer",
          position: "fixed",
          bottom: "100px",
          right: "100px",
        }}
      >
        Next...
      </button>
    )
  );
}
