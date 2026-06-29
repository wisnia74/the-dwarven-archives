import { useCallback } from "react";

import SQLiteWASM from "@/workers/SQLiteWASM?worker";

export const useSQLiteWASM = () => {
  const init = useCallback(() => {
    const sqlitewasm = new SQLiteWASM();

    sqlitewasm.postMessage({});
  }, []);

  return { init };
};
