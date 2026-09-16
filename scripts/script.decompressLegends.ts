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
  green,
  grey,
  gunzip,
  measureTimeTaken,
  msToSeconds,
} from "./utils";

void (async () => {
  const config = await getConfig();

  const dfDirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const dfDirFiles = await Promise.all(
    dfDirContent
      .filter((x) => x.endsWith(".xml.gz"))
      .map(async (x): Promise<[string, Stats]> => {
        const filepath = path.join(config.DWARF_FORTRESS_DIR, x);

        return [filepath, await fs.stat(filepath)];
      }),
  );

  const tempDirContent = await fs.readdir(TEMP_DIR, {
    recursive: true,
  });
  const tempDirFiles = await Promise.all(
    tempDirContent
      .filter((x) => x.endsWith(".xml.gz"))
      .map(async (x): Promise<[string, Stats]> => {
        const filepath = path.join(TEMP_DIR, x);

        return [filepath, await fs.stat(filepath)];
      }),
  );

  const files = [
    ...dfDirFiles.sort(
      ([, aStats], [, bStats]) => bStats.mtimeMs - aStats.mtimeMs,
    ),
    ...tempDirFiles.sort(
      ([, aStats], [, bStats]) => bStats.mtimeMs - aStats.mtimeMs,
    ),
  ];

  if (!files.length) {
    throw new Error(
      `No decompressable legends files found neither in ${config.DWARF_FORTRESS_DIR} nor in ${TEMP_DIR}`,
    );
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
    message: "Select file to decompress:",
  });

  const dest = await input({
    default: selectedFile.filepath.slice(0, -3),
    message: "Decompress as:",
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

  spinner.start("Decompressing...");

  const { timeTakenMs } = await measureTimeTaken(() =>
    gunzip(selectedFile.filepath, dest),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    `${green(`File decompressed to ${dest} in ${msToSeconds(timeTakenMs)}`)} ${grey(`(${bytesToMB(selectedFile.stats.size)} -> ${bytesToMB(destFileSize)})`)}`,
  );
})();
