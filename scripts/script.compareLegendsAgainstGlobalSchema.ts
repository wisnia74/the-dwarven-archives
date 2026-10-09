import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import ora from "ora";
import prettier from "prettier";

import legendsExampleSchema from "~/lib/legends.example.schema.json";

import { red, toSeconds, yellow } from "./formatters";
import { SchemaBuilderFactory } from "./SchemaBuilder";
import { type Script, theme } from "./Script";
import { measureExecutionTime } from "./utils";
import { XmlSanitizerStream } from "./XmlSanitizer";

const exec: Script["exec"] = async ([filepath]) => {
  const spinner = ora();

  const parser = new XMLParser({
    OutputBuilder: new SchemaBuilderFactory(),
    skip: {
      declaration: true,
    },
  });

  spinner.start(theme.style.highlight("Testing..."));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { executionTimeMs, returnValue } = await measureExecutionTime(() =>
    parser.parseStream(
      createReadStream(filepath).pipe(new XmlSanitizerStream()),
    ),
  );

  assert.ok(typeof returnValue === "string");

  const schema = JSON.parse(
    await prettier.format(returnValue, {
      parser: "json",
      tabWidth: 2,
      useTabs: false,
    }),
  ) as Record<string, Record<string, string[]>>;

  const wrapperElementsMissingFromGlobalSchema: string[] = [];
  const firstChildrenElementsMissingFromGlobalSchema: string[] = [];
  const valueMismatchForFirstChildren: string[] = [];

  for (const [wrapper, values] of Object.entries(schema)) {
    if (!Object.keys(legendsExampleSchema).includes(wrapper)) {
      wrapperElementsMissingFromGlobalSchema.push(
        `- expected legendsExampleSchema.${wrapper} to be defined`,
      );

      continue;
    }

    for (const [firstChild, firstChildValues] of Object.entries(values)) {
      // @ts-expect-error string can't be used to refer to keys of legendsExampleSchema, because it has exact keys
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (!Object.keys(legendsExampleSchema[wrapper]).includes(firstChild)) {
        firstChildrenElementsMissingFromGlobalSchema.push(
          `- expected legendsExampleSchema.${wrapper}.${firstChild} to be defined`,
        );

        continue;
      }

      if (
        firstChildValues.some(
          // @ts-expect-error string can't be used to refer to keys of legendsExampleSchema, because it has exact keys
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          (val) => !legendsExampleSchema[wrapper][firstChild].includes(val),
        )
      ) {
        valueMismatchForFirstChildren.push(
          // @ts-expect-error string can't be used to refer to keys of legendsExampleSchema, because it has exact keys
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
          `- expected ${wrapper}.${firstChild} to be ${legendsExampleSchema[wrapper][firstChild]}, received ${firstChildValues}`,
        );
      }
    }
  }

  if (
    [
      wrapperElementsMissingFromGlobalSchema,
      firstChildrenElementsMissingFromGlobalSchema,
      valueMismatchForFirstChildren,
    ].some((x) => x.length)
  ) {
    const failMsg = [
      red("Comparison failed:\n"),
      ...(wrapperElementsMissingFromGlobalSchema.length ?
        [...wrapperElementsMissingFromGlobalSchema.map((x) => red(`\n${x}`))]
      : []),
      ...(firstChildrenElementsMissingFromGlobalSchema.length ?
        [
          ...firstChildrenElementsMissingFromGlobalSchema.map((x) =>
            red(`\n${x}`),
          ),
        ]
      : []),
      ...(valueMismatchForFirstChildren.length ?
        [
          ...valueMismatchForFirstChildren.map((x) =>
            x.includes("to be json_array, received string") ?
              yellow(`\n${x}`)
            : red(`\n${x}`),
          ),
        ]
      : []),
    ];

    spinner.fail(failMsg.join(""));

    return;
  }

  spinner.succeed(
    [
      theme.style.message("Schema of", "done"),
      theme.style.highlight(filepath),
      theme.style.message("is a subset of the global schema", "done"),
      theme.style.help(`(tested in ${toSeconds(executionTimeMs)})`),
    ].join(" "),
  );
};

export const compareLegendsAgainstGlobalSchema: Script = {
  exec,
  helpText: "[r] compare against global schema",
  isAvailable: (filename: string) => filename.endsWith(".xml"),
  name: "compare legends against global schema",
  triggerKey: "r",
};
