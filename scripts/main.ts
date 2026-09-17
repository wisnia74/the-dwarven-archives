import "./TerminationHandler";

import type { Stats } from "node:fs";

import { select } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { TEMP_DIR } from "~/dirname";

import { dynamicScriptSelect, type ScriptAction, theme } from "./components";
import { config } from "./config";
import { compressLegends } from "./script.compressLegends";
import { copyLegends } from "./script.copyLegends";
import { decompressLegends } from "./script.decompressLegends";
import { deleteFile } from "./script.deleteFile";
import { legendsToJson } from "./script.legendsToJson";
import { legendsToSchema } from "./script.legendsToSchema";
import { testLegendsAgainstSchema } from "./script.testLegendsAgainstSchema";

const scripts: ScriptAction[] = [
  {
    helpText: `[p] copy`,
    isAvailable: (filename: string) =>
      filename.startsWith(config.DWARF_FORTRESS_DIR)
      && filename.endsWith(".xml"),
    script: {
      name: "copy legends",
      run: copyLegends,
    },
    triggerKey: "p",
  },
  {
    helpText: `[x] delete`,
    isAvailable: (filename: string) =>
      filename.endsWith(".json")
      || filename.endsWith(".xml")
      || filename.endsWith(".xml.gz"),
    script: {
      name: "delete file",
      run: deleteFile,
    },
    triggerKey: "x",
  },
  {
    helpText: "[c] compress",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "compress legends",
      run: compressLegends,
    },
    triggerKey: "c",
  },
  {
    helpText: "[d] decompress",
    isAvailable: (filename: string) => filename.endsWith(".xml.gz"),
    script: {
      name: "decompress legends",
      run: decompressLegends,
    },
    triggerKey: "d",
  },
  {
    helpText: "[j] to JSON",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "legends to json",
      run: legendsToJson,
    },
    triggerKey: "j",
  },
  {
    helpText: "[s] to schema",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "legends to schema",
      run: legendsToSchema,
    },
    triggerKey: "s",
  },
  {
    helpText: "[t] test against schema",
    isAvailable: (filename: string) => filename.endsWith(".xml"),
    script: {
      name: "test legends against schema",
      run: testLegendsAgainstSchema,
    },
    triggerKey: "t",
  },
];

void (async () => {
  let firstRun = true;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (!firstRun) {
      console.log(`\n${"─".repeat(140)}\n`);
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
