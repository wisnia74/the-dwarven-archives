import { describe, expect, it } from "vitest";

import { stripForbiddenXmlUnicodeCharacters } from "./XmlSanitizer";

describe("XmlSanitizer", () => {
  describe("stripForbiddenXmlUnicodeCharacters", () => {
    it("strips any forbidden XML 1.0 Unicode characters from the input string", () => {
      const range = (start: number, end: number): number[] => {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      };

      /**
       * Array of `["\x00", "\x01", "\x02", "\x03", "\x04", "\x05", ...]` Unicode characters (over 2,000 elements).
       */
      const forbiddenXmlUnicodeCharacters = [
        ...range(0x0000, 0x0008),
        ...range(0x000b, 0x000c),
        ...range(0x000e, 0x001f),
        ...range(0xd800, 0xdfff),
        ...range(0xfffe, 0xffff),
      ].map((codePoint) => String.fromCodePoint(codePoint));

      // Check whether Unicode character gets stripped if it's the only forbidden one inside the input string.
      for (const char of forbiddenXmlUnicodeCharacters) {
        expect(
          stripForbiddenXmlUnicodeCharacters(char),
          `U+${char.toUpperCase().padStart(4, "0")} was not removed`,
        ).toStrictEqual("");
      }

      const DELIMITER = "|";

      /**
       * Check whether all forbidden Unicode characters get stripped if they're all inside the input string.
       *
       * We join forbidden Unicode characters with a `|` delimiter instead of `.join("")`, because certain
       * Unicode characters represent valid astral Unicode characters when they are right next to each other.
       *
       * For example:
       * ```plain
       * \uD800\uDC00
       * ```
       *
       * Represents:
       * ```plain
       * U+10000
       * ```
       *
       * If we didn't use a delimiter, certain Unicode characters woldn't get stripped because they're not
       * within the range we use to check for forbidden Unicode characters. That's why we use a delimiter,
       * call the function, then expect the result to contain only the delimiter character, repeated
       * as many time as there were Unicode characters inside the input string.
       */
      expect(
        stripForbiddenXmlUnicodeCharacters(
          forbiddenXmlUnicodeCharacters.join(DELIMITER),
        ),
      ).toStrictEqual(
        DELIMITER.repeat(forbiddenXmlUnicodeCharacters.length - 1),
      );
    });

    it("preserves every XML 1.0 boundary character", () => {
      const xmlBoundaryUnicodeCharacters = [
        0x0009, 0x000a, 0x000d, 0x0020, 0xd7ff, 0xe000, 0xfffd, 0x10000,
        0x10ffff,
      ].map((codePoint) => String.fromCodePoint(codePoint));

      // Check whether XML boundary Unicode character gets preserved if it's the only one inside the input string.
      for (const char of xmlBoundaryUnicodeCharacters) {
        expect(
          stripForbiddenXmlUnicodeCharacters(char),
          `U+${char.toUpperCase().padStart(4, "0")} was not removed`,
        ).toStrictEqual(char);
      }

      // Check whether all XML boundary Unicode characters gets preserved if they're all inside the input string.
      expect(
        stripForbiddenXmlUnicodeCharacters(
          xmlBoundaryUnicodeCharacters.join(""),
        ),
      ).toStrictEqual(xmlBoundaryUnicodeCharacters.join(""));
    });
  });
});
