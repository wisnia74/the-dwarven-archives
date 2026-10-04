import { useCallback } from "react";

import SQLiteWASM from "@/workers/SqliteWasm?worker";

export const useSQLiteWASM = () => {
  const init = useCallback(
    () =>
      new Promise((resolve) => {
        const sqlitewasm = new SQLiteWASM();

        sqlitewasm.postMessage({ type: "start" });

        sqlitewasm.onmessage = (
          e: MessageEvent<{ message?: string; rows?: unknown[]; type: string }>,
        ) => {
          resolve({
            message: e.data.message,
            rows: e.data.rows,
            type: e.data.type,
          });

          sqlitewasm.terminate();
        };
      }),
    [SQLiteWASM],
  );

  return { init };
};
