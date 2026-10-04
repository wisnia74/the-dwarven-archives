import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

onmessage = async (e: MessageEvent<{ type: string }>) => {
  if (e.data.type === "start") {
    try {
      const sqlite3 = await sqlite3InitModule();
      const db = new sqlite3.oo1.OpfsDb(
        `test-${new Date().toISOString()}.sqlite`,
        "c",
      );

      // 1. Basic CRUD
      db.exec(
        "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)",
      );
      db.exec({
        bind: ["Alice", "Bob"],
        sql: "INSERT INTO test (name) VALUES (?), (?)",
      });

      const rows = db.selectObjects("SELECT * FROM test ORDER BY id");

      db.close();

      self.postMessage({ rows, type: "success" });
    } catch (err) {
      if (err instanceof Error) {
        self.postMessage({ message: err.message, type: "error" });

        return;
      }

      self.postMessage({ message: String(err), type: "error" });
    }
  }
};
