import XMLParser from "@nodable/flexible-xml-parser";
import assert from "node:assert";
import { createReadStream } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { __dirname } from "~/dirname";
import legendsSchema from "~/global/legends.schema.json";

import { XmlSanitizerStream } from "../XmlSanitizer";
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
  it("generates correct schema for DF legends XML file", async () => {
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

    expect(JSON.parse(result)).toStrictEqual(legendsSchema);
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
