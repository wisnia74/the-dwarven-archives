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
  copy,
  green,
  grey,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

void (async () => {
  const config = await getConfig();

  const dfDirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const dfDirFiles = await Promise.all(
    dfDirContent
      .filter((x) => x.endsWith(".xml"))
      .map(async (x): Promise<[string, Stats]> => {
        const filepath = path.join(config.DWARF_FORTRESS_DIR, x);

        return [filepath, await fs.stat(filepath)];
      }),
  );

  const files = [
    ...dfDirFiles.sort(
      ([, aStats], [, bStats]) => bStats.mtimeMs - aStats.mtimeMs,
    ),
  ];

  if (!files.length) {
    throw new Error(`No legends files found in ${config.DWARF_FORTRESS_DIR}`);
  }

  const selectedFile = await select({
    choices: files.map(([filepath, stats]) => ({
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
    copy(selectedFile.filepath, dest),
  );

  spinner.succeed(
    `${green(`File copied as ${dest} in ${msToSeconds(timeTakenMs)}`)} ${grey(`(${bytesToMB(selectedFile.stats.size)})`)}`,
  );
})();
