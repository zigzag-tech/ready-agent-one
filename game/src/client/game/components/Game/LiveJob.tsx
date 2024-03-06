import React from "react";
import { JobInfo, useJobBinding } from "@livestack/client/src";
import { GAME_SPEC_NAME, POEM_SPEC_NAME } from "../../../../common/game";

export const LiveJobContext = React.createContext<{
  mainJob: JobInfo | null;
  poemJob1: JobInfo | null;
  poemJob2: JobInfo | null;
}>({
  mainJob: null,
  poemJob1: null,
  poemJob2: null,
});
export function LiveJob({ children }: { children: React.ReactNode }) {
  const mainJob = useJobBinding({
    specName: GAME_SPEC_NAME,
  });

  const poemJob1 = useJobBinding({
    specName: POEM_SPEC_NAME,
  });
  const poemJob2 = useJobBinding({
    specName: POEM_SPEC_NAME,
  });

  return (
    <LiveJobContext.Provider value={{ mainJob, poemJob1, poemJob2 }}>
      {children}
    </LiveJobContext.Provider>
  );
}
