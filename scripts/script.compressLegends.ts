import { input } from "@inquirer/prompts";
import { createReadStream, createWriteStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import stream from "node:stream/promises";
import zlib from "node:zlib";
import ora from "ora";

import { theme } from "./components";
import { toMb, toSeconds } from "./formatters";
import { measureExecutionTime } from "./utils";

const gzip = async (source: string, dest: string): Promise<string> => {
  await stream.pipeline(
    createReadStream(path.resolve(source)),
    zlib.createGzip(),
    createWriteStream(path.resolve(dest)),
  );

  return dest;
};

export const compressLegends = async ([filepath, stats]: [string, Stats]) => {
  const spinner = ora();

  const dest = await input({
    default: filepath.concat(".gz"),
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

  spinner.start(theme.style.highlight("Compressing..."));

  const { executionTimeMs } = await measureExecutionTime(() =>
    gzip(filepath, dest),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    [
      theme.style.message("File compressed as", "done"),
      theme.style.highlight(dest),
      theme.style.message("in", "done"),
      theme.style.highlight(toSeconds(executionTimeMs)),
      theme.style.help(`(${toMb(stats.size)} -> ${toMb(destFileSize)})`),
    ].join(" "),
  );
};
