import "./TerminationHandler";

import { input, select } from "@inquirer/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";

import { TEMP_DIR } from "~/dirname";

import { getConfig } from "./config";
import { SchemaBuilderFactory } from "./SchemaBuilder";
import { spinner } from "./spinner";
import { bytesToMB, green, grey, measureTimeTaken, msToSeconds } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

void (async () => {
  const config = await getConfig();

  const dfDirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const dfDirFiles = await Promise.all(
    dfDirContent
      .filter((x) => x.endsWith(".xml"))
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
      .filter((x) => x.endsWith(".xml"))
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
      `No transformable legends files found neither in ${config.DWARF_FORTRESS_DIR} nor in ${TEMP_DIR}`,
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
