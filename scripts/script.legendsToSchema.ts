import "./TerminationHandler";

import { input, select } from "@inquirer/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";

import { TEMP_DIR } from "~/dirname";

import { SchemaBuilderFactory } from "./SchemaBuilder";
import { spinner } from "./spinner";
import { bytesToMB, green, grey, measureTimeTaken, msToSeconds } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

void (async () => {
  const dirContent = await fs.readdir(TEMP_DIR, {
    recursive: true,
  });

  const legendsFiles = dirContent
    .filter((x) => x.endsWith("legends.xml"))
    .map((x) => path.join(TEMP_DIR, x));

  if (!legendsFiles.length) {
    throw new Error(`No transformable files found in ${TEMP_DIR}`);
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
    message: "Select file to transform into schema:",
  });

  const dest = await input({
    default: selectedFile.filepath.slice(0, -3).concat("schema.json"),
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

  const parser = new XMLParser({
    OutputBuilder: new SchemaBuilderFactory(),
    skip: {
      declaration: true,
    },
  });

  spinner.start("Transforming...");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { returnValue, timeTakenMs } = await measureTimeTaken(() =>
    parser.parseStream(
      createReadStream(selectedFile.filepath).pipe(new XmlSanitizerStream()),
    ),
  );

  assert.ok(typeof returnValue === "string");

  await fs.writeFile(
    dest,
    await prettier.format(returnValue, {
      parser: "json",
      tabWidth: 2,
      useTabs: false,
    }),
  );

  const { size: destFileSize } = await fs.stat(dest);

  spinner.succeed(
    `${green(`File transformed to ${dest} in ${msToSeconds(timeTakenMs)}`)} ${grey(`(${bytesToMB(destFileSize)})`)}`,
  );
})();
