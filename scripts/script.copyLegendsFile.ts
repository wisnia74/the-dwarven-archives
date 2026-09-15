import "./TerminationHandler";

import type { Stats } from "node:fs";

import { input, select } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { TEMP_DIR } from "~/dirname";

import { getConfig } from "./config";
import { spinner } from "./spinner";
import {
  bytesToMB,
  copyFile,
  green,
  grey,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

void (async () => {
  const config = await getConfig();

  const dirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const files = dirContent
    .filter((x) => x.endsWith(".xml"))
    .map((x) => path.join(config.DWARF_FORTRESS_DIR, x));

  if (!files.length) {
    throw new Error(`No legends files found in ${config.DWARF_FORTRESS_DIR}`);
  }

  const stats = await Promise.all(
    files.map(async (filepath): Promise<[string, Stats]> => [
      filepath,
      await fs.stat(filepath),
    ]),
  );

  const selectedFile = await select({
    choices: stats
      .sort(([, aStats], [, bStats]) => bStats.mtimeMs - aStats.mtimeMs)
      .map(([filepath, stats]) => ({
        name: `${filepath} ${grey(
          `(${bytesToMB(stats.size)}, last modified ${new Date(
            stats.mtimeMs,
          ).toLocaleString()})`,
        )}`,
        value: { filepath, stats },
      })),
    message: "Select file to copy: ",
  });

  const dest = await input({
    default: path.join(
      TEMP_DIR,
      path.basename(selectedFile.filepath).replace("xml", "legends.xml"),
    ),
    message: "Copy as:",
    prefill: "editable",
    required: true,
    validate: async (dest) =>
      fs
        .access(dest, fs.constants.F_OK)
        .then(() => `${dest} already exists`)
        .catch(() => true),
  });

  await fs.mkdir(path.dirname(dest), {
    recursive: true,
  });

  spinner.start("Copying...");

  const { timeTakenMs } = await measureTimeTaken(() =>
    copyFile(selectedFile.filepath, dest),
  );

  spinner.succeed(
    `${green(`File copied as ${dest} in ${msToSeconds(timeTakenMs)}`)} ${grey(`(${bytesToMB(selectedFile.stats.size)})`)}`,
  );
})();
