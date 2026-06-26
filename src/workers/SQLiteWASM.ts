import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

onmessage = async () => {
  try {
    console.log({
      isolated: self.crossOriginIsolated,
      sab: typeof SharedArrayBuffer,
      thread: "worker",
    });
    console.log("Loading and initializing SQLite3 module...");
    const sqlite3 = await sqlite3InitModule();
    console.log({ sqlite3 });
    console.log("Done initializing. Running demo...");

    console.log("Running SQLite3 version", sqlite3.version.libVersion);

    const db =
      "opfs" in sqlite3 ?
        new sqlite3.oo1.OpfsDb("/mydb.sqlite3")
      : new sqlite3.oo1.DB("/mydb.sqlite3");

    // Your SQLite code here.
    console.log("Creating test table...");

    db.exec(`
  CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`);

    console.log("Inserting test data...");

    const insert = db.prepare("INSERT INTO test (name) VALUES (?)");
    insert.bind("hello sqlite");
    insert.step();
    insert.reset();

    insert.bind("second row");
    insert.step();
    insert.reset();

    insert.finalize();

    console.log("Querying data back...");

    const stmt = db.prepare("SELECT id, name FROM test ORDER BY id ASC");

    const rows = [];

    while (stmt.step()) {
      rows.push(stmt.get({ rowMode: "object" }));
    }

    stmt.finalize();

    console.log(rows);

    console.log("Query result:", rows);

    // basic sanity check
    if (rows.length >= 2) {
      console.log("✅ SQLite test succeeded");
    } else {
      console.warn("⚠️ SQLite test returned unexpected result");
    }

    // @ts-expect-error lazylazylazy
    async function listDirectory(dirHandle, path = "") {
      const entries = [];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      for await (const [name, handle] of dirHandle.entries()) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const fullPath = path + "/" + name;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (handle.kind === "file") {
          entries.push({ path: fullPath, type: "file" });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (handle.kind === "directory") {
          entries.push({ path: fullPath, type: "dir" });
          // @ts-expect-error lazylazylazy
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const sub = await listDirectory(handle, fullPath);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          entries.push(...sub);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return entries;
    }

    const root = await navigator.storage.getDirectory();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const listing = await listDirectory(root);

    console.log("OPFS structure:");
    console.table(listing);
  } catch (err) {
    console.error("Initialization error:", err);
  }
};
