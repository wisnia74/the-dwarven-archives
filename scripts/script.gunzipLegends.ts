import { input } from "@inquirer/prompts";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import stream from "node:stream/promises";
import zlib from "node:zlib";
import ora from "ora";

import { toMb, toSeconds } from "./formatters";
import { type Script, theme } from "./Script";
import { measureExecutionTime } from "./utils";

const exec: Script["exec"] = async ([filepath, stats]) => {
  const spinner = ora();

  const dest = await input({
    default: filepath.slice(0, -3),
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

  spinner.start(theme.style.highlight("Decompressing..."));

  const { executionTimeMs } = await measureExecutionTime(() =>
    stream.pipeline(
      createReadStream(path.resolve(filepath)),
      zlib.createGunzip(),
      createWriteStream(path.resolve(dest)),
    ),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    [
      theme.style.message("File decompressed as", "done"),
      theme.style.highlight(dest),
      theme.style.message("in", "done"),
      theme.style.highlight(toSeconds(executionTimeMs)),
      theme.style.help(`(${toMb(stats.size)} -> ${toMb(destFileSize)})`),
    ].join(" "),
  );
};

export const gunzipLegends: Script = {
  exec,
  helpText: "[u] gunzip",
  isAvailable: (filename: string) => filename.endsWith(".gz"),
  name: "gunzip legends",
  triggerKey: "u",
};
