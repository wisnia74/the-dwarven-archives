import { AppShell } from "../components";
import { useLegendsParser } from "../hooks";

export const WorldsPage = () => {
  const { isParsing, parsedWorld, parseWorld } = useLegendsParser();
  if (parsedWorld) {
    console.log({ parsedWorld });
  }
  return (
    <AppShell>
      <input
        onChange={(e) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          parseWorld(e.target.files![0]);
        }}
        type="file"
      />
      {!isParsing ?
        <p>Worker inactive</p>
      : <p>Parsing...</p>}
      {parsedWorld && <p>World parsed!</p>}
    </AppShell>
  );
};
