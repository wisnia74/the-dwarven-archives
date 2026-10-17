import { input } from "@inquirer/prompts";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import stream from "node:stream/promises";
import ora from "ora";

import { TEMP_DIR } from "~/dirname";

import { config } from "./config";
import { type Script, theme } from "./Script";
import { measureExecutionTime, toMb, toSeconds } from "./utils";

const exec: Script["exec"] = async ([filepath, stats]) => {
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
    stream.pipeline(
      createReadStream(path.resolve(filepath)),
      createWriteStream(path.resolve(dest)),
    ),
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

export const copyLegends: Script = {
  exec,
  helpText: `[c] copy`,
  isAvailable: (filename: string) =>
    filename.startsWith(config.DWARF_FORTRESS_DIR) && filename.endsWith(".xml"),
  name: "copy legends",
  triggerKey: "c",
};
