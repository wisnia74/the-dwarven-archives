import { useCallback, useState } from "react";

import WorldParser from "../workers/WorldParser?worker";

export const useWorldParser = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedWorld, setParsedWorld] = useState<null | Record<
    string,
    unknown
  >>(null);

  const parseWorld = useCallback(
    (world: File) => {
      setIsParsing(true);

      const worldParser = new WorldParser();

      worldParser.postMessage(world);

      worldParser.onmessage = (ev: MessageEvent<Record<string, unknown>>) => {
        console.log({ ev });
        setParsedWorld(ev.data);
        setIsParsing(false);
      };
    },
    [setIsParsing],
  );

  return {
    isParsing,
    parsedWorld,
    parseWorld,
  };
};
