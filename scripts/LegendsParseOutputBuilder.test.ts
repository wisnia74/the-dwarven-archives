import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";

import {
  LegendsParseOutputBuilder,
  LegendsParseOutputBuilderFactory,
} from "./LegendsParseOutputBuilder";
import { TypedXmlParser } from "./TypedXmlParser";

const toReadableBuffer = (str: string): Readable =>
  Readable.from(Buffer.from(str));

describe("LegendsParseOutputBuilder", () => {
  describe("correctly parses", () => {
    it("region", async () => {
      const parser = new TypedXmlParser({
        OutputBuilder: new LegendsParseOutputBuilderFactory(),
      });

      await expect(
        parser.parseStream(
          toReadableBuffer(`
            <region>
              <id>0</id>
              <name>test</name>
              <type>Desert</type>
            </region>
          `),
        ),
      ).resolves.toStrictEqual({
        success: true,
      });
    });
  });
});

describe("LegendsParseOutputBuilderFactory", () => {
  describe("getInstance", () => {
    it("returns an instance of SchemaBuilder", () => {
      expect(
        new LegendsParseOutputBuilderFactory().getInstance({}, null),
      ).toBeInstanceOf(LegendsParseOutputBuilder);
    });
  });
});
