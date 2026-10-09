import { input } from "@inquirer/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import { SequentialStreamBuilderFactory } from "@nodable/sequential-stream-builder";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";

import { toMb, toSeconds } from "./formatters";
import { type Script, theme } from "./Script";
import { measureExecutionTime } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

const exec: Script["exec"] = async ([filepath]) => {
  const spinner = ora();

  const dest = await input({
    default: filepath.slice(0, -3).concat("json"),
    message: "Transform as:",
    prefill: "editable",
    required: true,
    validate: (dest) =>
      fs
        .access(dest, fs.constants.F_OK)
        .then(() => `${dest} already exists`)
        .catch(() => true),
  });

  await fs.mkdir(path.dirname(dest), {
    recursive: true,
  });

  const output = createWriteStream(dest, { encoding: "utf-8" });

  const parser = new XMLParser({
    OutputBuilder: new SequentialStreamBuilderFactory({
      stream: output,
    }),
    skip: {
      declaration: true,
    },
  });

  spinner.start(theme.style.highlight("Transforming..."));

  const { executionTimeMs } = await measureExecutionTime(() =>
    parser.parseStream(
      createReadStream(filepath).pipe(new XmlSanitizerStream()),
    ),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    [
      theme.style.message("File transformed as", "done"),
      theme.style.highlight(dest),
      theme.style.message("in", "done"),
      theme.style.highlight(toSeconds(executionTimeMs)),
      theme.style.help(`(${toMb(destFileSize)})`),
    ].join(" "),
  );
};

export const legendsToJson: Script = {
  exec,
  helpText: "[j] to JSON",
  isAvailable: (filename: string) => filename.endsWith(".xml"),
  name: "transform legends to json",
  triggerKey: "j",
};
