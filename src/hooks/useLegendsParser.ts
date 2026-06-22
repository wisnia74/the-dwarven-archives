import { useCallback, useState } from "react";

import LegendsParser from "../workers/LegendsParser?worker";

export const useLegendsParser = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedWorld, setParsedWorld] = useState<null | Record<
    string,
    unknown
  >>(null);

  const parseWorld = useCallback(
    (world: File) => {
      setIsParsing(true);

      const legendsParser = new LegendsParser();

      legendsParser.postMessage(world);

      legendsParser.onmessage = (ev: MessageEvent<Record<string, unknown>>) => {
        console.log({ ev });
        setParsedWorld(ev.data);
        setIsParsing(false);
        legendsParser.terminate();
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
