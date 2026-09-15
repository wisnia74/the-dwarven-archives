import "./TerminationHandler";

import type { Stats } from "node:fs";

import { input, select } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { TEMP_DIR } from "~/dirname";

import { spinner } from "./spinner";
import {
  bytesToMB,
  green,
  grey,
  gzip,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

void (async () => {
  const dirContent = await fs.readdir(TEMP_DIR, {
    recursive: true,
  });

  const legendsFiles = dirContent
    .filter((x) => x.endsWith("legends.xml"))
    .map((x) => path.join(TEMP_DIR, x));

  if (!legendsFiles.length) {
    throw new Error(`No compressable legends files found in ${TEMP_DIR}`);
  }

  const stats = await Promise.all(
    legendsFiles.map(async (filepath): Promise<[string, Stats]> => [
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
    message: "Select file to compress:",
  });

  const dest = await input({
    default: selectedFile.filepath.concat(".gz"),
    message: "Compress as:",
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

  spinner.start("Compressing...");

  const { timeTakenMs } = await measureTimeTaken(() =>
    gzip(selectedFile.filepath, dest),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    `${green(`File compressed as ${dest} in ${msToSeconds(timeTakenMs)}`)} ${grey(`(${bytesToMB(selectedFile.stats.size)} -> ${bytesToMB(destFileSize)})`)}`,
  );
})();
