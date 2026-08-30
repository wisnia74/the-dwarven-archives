import { autocomplete, intro, isCancel, outro } from "@clack/prompts";
import fs from "fs/promises";
import path from "path";

import { __dirname } from "~/dirname";

import { type Script, SCRIPT_STATUS } from "./script";
import compressLegendsFile from "./script.compressLegendsFile";
import decompressLegendsFile from "./script.decompressLegendsFile";
import importLegendsFile from "./script.importLegendsFile";
import transformLegendsFileIntoJson from "./script.transformLegendsFileIntoJson";
import transformLegendsFileIntoSchema from "./script.transformLegendsFileIntoSchema";
import { cancelScript } from "./utils";

const scripts: Record<string, Script> = {
  compressLegendsFile,
  decompressLegendsFile,
  importLegendsFile,
  transformLegendsFileIntoJson,
  transformLegendsFileIntoSchema,
};

const scriptList = async () => {
  intro("Scripts");

  const selectedScript = await autocomplete({
    message: "Select script:",
    options: Object.values(scripts).map((script) => ({
      hint: script.hint,
      label: script.label,
      value: script.run,
    })),
  });

  if (isCancel(selectedScript)) {
    cancelScript({ trigger: "user" });
    process.exit(0);
  }

  const result = await selectedScript();

  if (result !== SCRIPT_STATUS.CANCELLED) {
    outro("Script finished");
  }

  return scriptList();
};

void (async () => {
  await fs.mkdir(path.join(__dirname, "legends"), { recursive: true });
  void scriptList();
})();
