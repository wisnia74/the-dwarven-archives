import "./TerminationHandler";

import type { Stats } from "node:fs";

import { select } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { TEMP_DIR } from "~/dirname";

import { config } from "./config";
import { dynamicScriptSelect } from "./dynamicScriptSelect";
import { theme } from "./Script";
import { copyLegends } from "./script.copyLegends";
import { deleteFile } from "./script.deleteFile";
import { gunzipLegends } from "./script.gunzipLegends";
import { gzipLegends } from "./script.gzipLegends";
import { legendsToJson } from "./script.legendsToJson";
import { parseLegends } from "./script.parseLegends";

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
      scripts: [
        copyLegends,
        deleteFile,
        gzipLegends,
        gunzipLegends,
        legendsToJson,
        parseLegends,
      ],
      theme,
    });

    firstRun = false;

    if (!selection) {
      continue;
    }

    await selection.exec(selection.file);
  }
})();
