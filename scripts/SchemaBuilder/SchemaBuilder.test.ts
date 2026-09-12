import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert";
import { createReadStream } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { __dirname } from "~/dirname";

import { XmlSanitizerStream } from "../XmlSanitizer/XmlSanitizer";
import {
  SchemaBuilder,
  SchemaBuilderFactory,
  type SerializableValue,
  toStringifiableValue,
} from "./SchemaBuilder";
import SchemaBuilderSchemaJson from "./SchemaBuilder.schema.json";

describe("toStringifiableValue", () => {
  it("converts Map containing a mix of Maps, Sets and strings to a stringifiable value", () => {
    const stringifiable = toStringifiableValue(
      new Map<string, SerializableValue>([
        ["map", new Map([["a", "b"]])],
        ["set", new Set(["c", "d"])],
        ["string", "e"],
      ]),
    );

    expect(stringifiable).toStrictEqual({
      map: { a: "b" },
      set: ["c", "d"],
      string: "e",
    });

    expect(JSON.stringify(stringifiable)).toStrictEqual(
      '{"map":{"a":"b"},"set":["c","d"],"string":"e"}',
    );
  });
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

describe("SchemaBuilder", () => {
  it("generates correct schema from DF legends XML file", async () => {
    const parser = new XMLParser({
      OutputBuilder: new SchemaBuilderFactory({}),
      skip: {
        declaration: true,
      },
    });

    const result = await parser.parseStream(
      createReadStream(
        path.join(
          __dirname,
          "scripts",
          "SchemaBuilder",
          "SchemaBuilder.fixture.xml",
        ),
      ).pipe(new XmlSanitizerStream()),
    );
    assert.ok(typeof result === "string");

    const parsedResult = JSON.parse(result);
    assert.ok(isObject(parsedResult));

    expect(parsedResult).toStrictEqual(SchemaBuilderSchemaJson);
  });
});

describe("SchemaBuilderFactory", () => {
  describe("getInstance()", () => {
    it("returns an instance of SchemaBuilder", () => {
      expect(new SchemaBuilderFactory().getInstance({}, null)).toBeInstanceOf(
        SchemaBuilder,
      );
    });
  });
});
