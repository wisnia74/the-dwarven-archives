import { useCallback } from "react";

type OpfsHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

export const useOpfs = () => {
  const getEntries = useCallback(
    async (type?: "directory" | "file"): Promise<OpfsHandle[]> => {
      const root = await navigator.storage.getDirectory();
      const result: OpfsHandle[] = [];

      for await (const entry of root.entries()) {
        const [, handle] = entry;

        if (
          type === undefined
          || (type === "directory" && handle.kind === "directory")
          || (type === "file" && handle.kind === "file")
        ) {
          result.push(handle);
        }
      }

      return result;
    },
    [navigator],
  );

  const deleteEntry = useCallback(
    async (
      handle: FileSystemDirectoryHandle | FileSystemFileHandle,
    ): Promise<void> => {
      const root = await navigator.storage.getDirectory();

      await root.removeEntry(handle.name, {
        recursive: handle.kind === "directory",
      });
    },
    [navigator],
  );

  return {
    deleteEntry,
    getEntries,
  };
};
