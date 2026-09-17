import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream, type Stats } from "node:fs";
import ora from "ora";
import prettier from "prettier";

import globalSchema from "~/lib/legends.schema.json";

import { theme } from "./components";
import { toSeconds } from "./formatters";
import { SchemaBuilderFactory } from "./SchemaBuilder";
import {
  assertActualIsSubsetOfExpected,
  isObject,
  measureExecutionTime,
} from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

export const testLegendsAgainstSchema = async ([filepath]: [string, Stats]) => {
  const spinner = ora();

  const parser = new XMLParser({
    OutputBuilder: new SchemaBuilderFactory(),
    skip: {
      declaration: true,
    },
  });

  spinner.start("Testing...");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { executionTimeMs, returnValue } = await measureExecutionTime(() =>
    parser.parseStream(
      createReadStream(filepath).pipe(new XmlSanitizerStream()),
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
    [
      theme.style.message("Schema of", "done"),
      theme.style.highlight(filepath),
      theme.style.message("is a subset of the global schema", "done"),
      theme.style.help(`(tested in ${toSeconds(executionTimeMs)})`),
    ].join(" "),
  );
};
