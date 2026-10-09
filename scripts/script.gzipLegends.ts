import { input } from "@inquirer/prompts";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import stream from "node:stream/promises";
import zlib from "node:zlib";
import ora from "ora";

import type { Script } from "./Script";

import { theme } from "./dynamicScriptSelect";
import { toMb, toSeconds } from "./formatters";
import { measureExecutionTime } from "./utils";

const exec: Script["exec"] = async ([filepath, stats]) => {
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
    stream.pipeline(
      createReadStream(path.resolve(filepath)),
      zlib.createGzip(),
      createWriteStream(path.resolve(dest)),
    ),
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

export const gzipLegends = {
  exec,
  helpText: "[z] gzip",
  isAvailable: (filename: string) => filename.endsWith(".xml"),
  name: "gzip legends",
  triggerKey: "z",
};
