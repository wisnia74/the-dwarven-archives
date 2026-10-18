import { input } from "@inquirer/prompts";
import { createReadStream } from "node:fs";
import { access, constants, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import ora from "ora";
import prettier from "prettier";

import { SchemaBuilderFactory } from "./SchemaBuilder";
import { type Script, theme } from "./Script";
import { TypedXmlParser } from "./TypedXmlParser";
import { measureExecutionTime, toMb, toSeconds } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

const exec: Script["exec"] = async ([filepath]) => {
  const spinner = ora();

  const dest = await input({
    default: filepath.slice(0, -3).concat("schema.json"),
    message: "Transform as:",
    prefill: "editable",
    required: true,
    validate: (dest) =>
      access(dest, constants.F_OK)
        .then(() => `${dest} already exists`)
        .catch(() => true),
  });

  await mkdir(dirname(dest), {
    recursive: true,
  });

  const parser = new TypedXmlParser({
    OutputBuilder: new SchemaBuilderFactory(),
    skip: {
      declaration: true,
    },
  });

  spinner.start(theme.style.highlight("Transforming..."));

  const { executionTimeMs, returnValue } = await measureExecutionTime(() =>
    parser.parseStream(
      createReadStream(filepath).pipe(new XmlSanitizerStream()),
    ),
  );

  await writeFile(
    dest,
    await prettier.format(returnValue, {
      parser: "json",
      tabWidth: 2,
      useTabs: false,
    }),
  );

  const { size: destFileSize } = await stat(dest);

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

export const legendsToSchema: Script = {
  exec,
  helpText: "[s] to schema",
  isAvailable: (filename: string) => filename.endsWith(".xml"),
  name: "transform legends to schema",
  triggerKey: "s",
};
