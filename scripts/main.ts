import "./TerminationHandler";

import type { Stats } from "node:fs";

import { select } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { TEMP_DIR } from "~/dirname";

import { dynamicScriptSelect, type ScriptAction, theme } from "./components";
import { config } from "./config";
import { compareLegendsAgainstGlobalSchema } from "./script.compareLegendsAgainstGlobalSchema";
import { copyLegends } from "./script.copyLegends";
import { deleteFile } from "./script.deleteFile";
import { gunzipLegends } from "./script.gunzipLegends";
import { gzipLegends } from "./script.gzipLegends";
import { legendsToJson } from "./script.legendsToJson";
import { legendsToSchema } from "./script.legendsToSchema";

const scripts: ScriptAction[] = [
  {
    helpText: `[c] copy`,
    isAvailable: (filename: string) =>
      filename.startsWith(config.DWARF_FORTRESS_DIR)
      && filename.endsWith(".xml"),
    script: {
      name: "copy legends",
      run: copyLegends,
    },
    triggerKey: "c",
  },
  {
    helpText: `[x] delete`,
    isAvailable: () => true,
    script: {
      name: "delete file",
      run: deleteFile,
    },
    triggerKey: "x",
  },
  {
    helpText: "[z] gzip",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "gzip legends",
      run: gzipLegends,
    },
    triggerKey: "z",
  },
  {
    helpText: "[u] gunzip",
    isAvailable: (filename: string) => filename.endsWith(".gz"),
    script: {
      name: "gunzip legends",
      run: gunzipLegends,
    },
    triggerKey: "u",
  },
  {
    helpText: "[j] to JSON",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "transform legends to json",
      run: legendsToJson,
    },
    triggerKey: "j",
  },
  {
    helpText: "[s] to schema",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "transform legends to schema",
      run: legendsToSchema,
    },
    triggerKey: "s",
  },
  {
    helpText: "[r] compare against global schema",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "compare legends against global schema",
      run: compareLegendsAgainstGlobalSchema,
    },
    triggerKey: "r",
  },
];

void (async () => {
  let firstRun = true;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (!firstRun) {
      console.log(`\n${"─".repeat(80)}\n`);
    }

    const dir = await select({
      choices: [TEMP_DIR, config.DWARF_FORTRESS_DIR],
      message: "Choose directory:",
    });

    const dirContent = await fs.readdir(dir);

    const files = (
      await Promise.all(
        dirContent
          .filter(
            (x) =>
              x.endsWith(".json")
              || x.endsWith(".xml")
              || x.endsWith(".xml.gz"),
          )
          .map(async (x): Promise<[string, Stats]> => {
            const filepath = path.join(dir, x);

            return [filepath, await fs.stat(filepath)];
          }),
      )
    ).sort(([a], [b]) => a.localeCompare(b));

    const selection = await dynamicScriptSelect({
      files,
      message:
        "Select a file and press a button corresponding to the script you wish to run:",
      scripts,
      theme,
    });

    if (!selection) {
      break;
    }

    await selection.script.run(selection.file);

    firstRun = false;
  }
})();
