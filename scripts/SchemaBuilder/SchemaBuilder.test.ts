import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SCHEMA_DIR } from "~/dirname";
import legendsExampleSchema from "~/lib/legends.example.schema.json";
import { XmlSanitizerStream } from "~/scripts/XmlSanitizer";

import {
  SchemaBuilder,
  SchemaBuilderFactory,
  type SerializableValue,
  toStringifiableValue,
} from "./SchemaBuilder";

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

describe("SchemaBuilder", () => {
  it("generates correct schema for legends file", async () => {
    const parser = new XMLParser({
      OutputBuilder: new SchemaBuilderFactory({}),
      skip: {
        declaration: true,
      },
    });

    const result = await parser.parseStream(
      createReadStream(path.join(SCHEMA_DIR, "legends.example.xml")).pipe(
        new XmlSanitizerStream(),
      ),
    );
    assert.ok(typeof result === "string");

    expect(JSON.parse(result)).toStrictEqual(legendsExampleSchema);
  });
});

describe("SchemaBuilderFactory", () => {
  describe("getInstance", () => {
    it("returns an instance of SchemaBuilder", () => {
      expect(new SchemaBuilderFactory().getInstance({}, null)).toBeInstanceOf(
        SchemaBuilder,
      );
    });
  });
});
