import "./TerminationHandler";

import { select } from "@inquirer/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";

import { TEMP_DIR } from "~/dirname";
import globalSchema from "~/lib/legends.schema.json";

import { getConfig } from "./config";
import { SchemaBuilderFactory } from "./SchemaBuilder";
import { spinner } from "./spinner";
import {
  assertActualIsSubsetOfExpected,
  bytesToMB,
  green,
  grey,
  isObject,
  measureTimeTaken,
  msToSeconds,
} from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

void (async () => {
  const config = await getConfig();

  const dfDirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const dfDirFiles = dfDirContent
    .filter((x) => x.endsWith(".xml"))
    .map((x) => path.join(config.DWARF_FORTRESS_DIR, x));

  const tempDirContent = await fs.readdir(TEMP_DIR);
  const tempDirFiles = tempDirContent
    .filter((x) => x.endsWith(".xml"))
    .map((x) => path.join(TEMP_DIR, x));

  const files = [...dfDirFiles, ...tempDirFiles];

  if (!files.length) {
    throw new Error(`No legends files found in ${config.DWARF_FORTRESS_DIR}`);
  }

  const stats = await Promise.all(
    files.map(async (filepath): Promise<[string, Stats]> => [
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
    message: "Select file to compare against global schema:",
  });

  const parser = new XMLParser({
    OutputBuilder: new SchemaBuilderFactory(),
    skip: {
      declaration: true,
    },
  });

  spinner.start("Comparing...");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { returnValue, timeTakenMs } = await measureTimeTaken(() =>
    parser.parseStream(
      createReadStream(selectedFile.filepath).pipe(new XmlSanitizerStream()),
    ),
  );

  assert.ok(typeof returnValue === "string");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schema = JSON.parse(
    await prettier.format(returnValue, {
      parser: "json",
      tabWidth: 2,
      useTabs: false,
    }),
  );

  assert.ok(isObject(schema));

  assertActualIsSubsetOfExpected(schema, globalSchema);

  spinner.succeed(
    `${green(`Schema of ${selectedFile.filepath} is a subset of the global schema`)} ${grey(`(compared in ${msToSeconds(timeTakenMs)})`)}`,
  );
})();
