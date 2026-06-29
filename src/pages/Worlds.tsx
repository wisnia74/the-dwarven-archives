import { useLegendsParser } from "@/hooks/useLegendsParser";
import { useSQLiteWASM } from "@/hooks/useSQLiteWASM";

export const Worlds = () => {
  const { isParsing, parsedWorld, parseWorld } = useLegendsParser();
  const { init } = useSQLiteWASM();
  if (parsedWorld) {
    console.log({ parsedWorld });
  }

  console.log({
    isolated: window.crossOriginIsolated,
    sab: typeof SharedArrayBuffer,
    thread: "main",
  });
  return (
    <>
      <input
        onChange={(e) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          parseWorld(e.target.files![0]);
          init();
        }}
        type="file"
      />
      {!isParsing ?
        <p>Worker inactive</p>
      : <p>Parsing...</p>}
      {parsedWorld && <p>World parsed!</p>}
      <button
        onClick={async () => {
          console.log(JSON.stringify(await navigator.storage.estimate()));
          async function listOPFS() {
            const root = await navigator.storage.getDirectory();

            async function walk(dir: FileSystemDirectoryHandle, path = "") {
              for await (const [name, handle] of dir.entries()) {
                const fullPath = `${path}/${name}`;

                if (handle.kind === "file") {
                  const file = await handle.getFile();
                  console.log(fullPath, file.size);
                }

                if (handle.kind === "directory") {
                  await walk(handle, fullPath);
                }
              }
            }

            await walk(root);
          }

          await listOPFS();
        }}
      >
        test
      </button>
    </>
  );
};
