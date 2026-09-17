import { input } from "@inquirer/prompts";
import { createReadStream, createWriteStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import stream from "node:stream/promises";
import ora from "ora";

import { TEMP_DIR } from "~/dirname";

import { theme } from "./components";
import { toMb, toSeconds } from "./formatters";
import { measureExecutionTime } from "./utils";

const copy = async (source: string, dest: string): Promise<string> => {
  await stream.pipeline(
    createReadStream(path.resolve(source)),
    createWriteStream(path.resolve(dest)),
  );

  return dest;
};

export const copyLegends = async ([filepath, stats]: [string, Stats]) => {
  const spinner = ora();

  const dest = await input({
    default: path.join(
      TEMP_DIR,
      path.basename(filepath).replace("xml", "legends.xml"),
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

  spinner.start(theme.style.highlight("Copying..."));

  const { executionTimeMs } = await measureExecutionTime(() =>
    copy(filepath, dest),
  );

  spinner.succeed(
    [
      theme.style.message("File copied as", "done"),
      theme.style.highlight(dest),
      theme.style.message("in", "done"),
      theme.style.highlight(toSeconds(executionTimeMs)),
      theme.style.help(`(${toMb(stats.size)})`),
    ].join(" "),
  );
};
