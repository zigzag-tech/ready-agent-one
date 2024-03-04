import React from "react";
import { JobInfo, useJobBinding } from "@livestack/client/src";
import { GAME_SPEC_NAME } from "../../../../common/game";

export const LiveJobContext = React.createContext<{
  mainJob: JobInfo | null;
}>({
  mainJob: null,
});
export function LiveJob({ children }: { children: React.ReactNode }) {
  const job = useJobBinding({
    specName: GAME_SPEC_NAME,
  });

  return (
    <LiveJobContext.Provider value={{ mainJob: job }}>
      {children}
    </LiveJobContext.Provider>
  );
}
