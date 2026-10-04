import { useEffect } from "react";

import { useOpfs } from "@/hooks/useOpfs";
import { useSQLiteWASM } from "@/hooks/useSqliteWasm";

export const Worlds = () => {
  console.log({
    isolated: window.crossOriginIsolated,
    sab: typeof SharedArrayBuffer,
    thread: "main",
  });
  const { init } = useSQLiteWASM();
  const { deleteEntry, getEntries } = useOpfs();

  useEffect(() => {
    getEntries()
      .then((entries) => Promise.all(entries.map(deleteEntry)))
      .then(() => getEntries())
      .then((x) => {
        console.log("before: ", x);
      })
      .then(() => init())
      .then((x) => {
        console.log("result: ", x);
      })
      .then(() => getEntries())
      // .then(console.log)
      // .then(() => getEntries())
      // .then((entries) => Promise.all(entries.map(deleteEntry)))
      // .then(() => getEntries())
      .then((x) => {
        console.log("after: ", x);
      })
      .catch(console.error);
  }, []);

  return <div>Worlds</div>;
};
