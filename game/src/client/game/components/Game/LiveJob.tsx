import React from "react";
import { type JobInfo, useJobBinding } from "@livestack/client";
import { GAME_SPEC_NAME } from "../../../../common/game";

export const LiveJobContext = React.createContext<{
  mainJob: JobInfo<any> | null;
  conersationJob: JobInfo<any> | null;
}>({
  mainJob: null,
  conersationJob: null,
});
export function LiveJob({ children }: { children: React.ReactNode }) {
  const mainJob = useJobBinding({
    specName: GAME_SPEC_NAME,
  });

  const conersationJob = useJobBinding({
    specName: "CONVERSATION_WORKFLOW",
  });

  return (
    <LiveJobContext.Provider value={{ mainJob, conersationJob }}>
      {children}
    </LiveJobContext.Provider>
  );
}
