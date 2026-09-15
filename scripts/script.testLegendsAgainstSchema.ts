import "./TerminationHandler";

import { select } from "@inquirer/prompts";
import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";

import globalLegendsSchema from "~/global/legends.schema.json";

import { getConfig } from "./config";
import { SchemaBuilderFactory } from "./SchemaBuilder";
import { spinner } from "./spinner";
import { bytesToMB, green, grey, measureTimeTaken, msToSeconds } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

void (async () => {
  const config = await getConfig();

  const dirContent = await fs.readdir(config.DWARF_FORTRESS_DIR);
  const files = dirContent
    .filter((x) => x.endsWith(".xml"))
    .map((x) => path.join(config.DWARF_FORTRESS_DIR, x));

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

  assert.deepEqual(
    JSON.parse(
      await prettier.format(returnValue, {
        parser: "json",
        tabWidth: 2,
        useTabs: false,
      }),
    ),
    globalLegendsSchema,
  );

  spinner.succeed(
    `${green(`${selectedFile.filepath} is a subset of the global schema`)} ${grey(`(compared in ${msToSeconds(timeTakenMs)})`)}`,
  );
})();
